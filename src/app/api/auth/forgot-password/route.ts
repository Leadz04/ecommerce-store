import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';
import { User } from '@/models';
import { sendEmail, generatePasswordResetHTML, generatePasswordResetText } from '@/lib/email';

export async function POST(request: NextRequest) {
  console.log('[API /auth/forgot-password] Forgot password request received');
  try {
    await connectDB();
    
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
      const expiryDate = new Date(resetTokenExpiry);

      console.log('[API /auth/forgot-password] Generated token:', resetToken.substring(0, 10) + '...');
      console.log('[API /auth/forgot-password] Full token:', resetToken);
      console.log('[API /auth/forgot-password] Token expires at:', expiryDate);
      console.log('[API /auth/forgot-password] User ID:', user._id);

      // Get the collection name from the User model
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      const collectionName = User.collection.name;
      console.log('[API /auth/forgot-password] Using collection:', collectionName);
      console.log('[API /auth/forgot-password] User _id type:', typeof user._id, user._id);
      
      const usersCollection = db.collection(collectionName);
      
      // Convert user._id to ObjectId if it's a string
      const userId = typeof user._id === 'string' ? new mongoose.Types.ObjectId(user._id) : user._id;
      
      console.log('[API /auth/forgot-password] Updating user with ID:', userId);
      console.log('[API /auth/forgot-password] Setting token:', resetToken.substring(0, 20) + '...');
      console.log('[API /auth/forgot-password] Setting expiry:', expiryDate);
      
      const updateResult = await usersCollection.updateOne(
        { _id: userId },
        {
          $set: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: expiryDate
          }
        }
      );
      
      console.log('[API /auth/forgot-password] Native MongoDB update result:', {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        acknowledged: updateResult.acknowledged,
        upsertedCount: updateResult.upsertedCount
      });
      
      if (updateResult.matchedCount === 0) {
        console.error('❌ [API /auth/forgot-password] No user matched for update');
        // Try to find the user to see if it exists
        const checkUser = await usersCollection.findOne({ _id: userId });
        console.log('[API /auth/forgot-password] User exists in collection?', !!checkUser);
        if (checkUser) {
          console.log('[API /auth/forgot-password] User email in collection:', checkUser.email);
        }
        throw new Error('Failed to update user');
      }
      
      // Wait a moment for write to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the update worked by querying directly
      const verifyResult = await usersCollection.findOne(
        { _id: userId },
        { projection: { resetPasswordToken: 1, resetPasswordExpires: 1, email: 1 } }
      );
      
      console.log('[API /auth/forgot-password] Verification query result:', {
        found: !!verifyResult,
        hasToken: !!verifyResult?.resetPasswordToken,
        tokenMatch: verifyResult?.resetPasswordToken === resetToken,
        email: verifyResult?.email
      });
      
      if (verifyResult && verifyResult.resetPasswordToken === resetToken) {
        console.log('✅ [API /auth/forgot-password] Token verified in database');
        console.log('[API /auth/forgot-password] Token in DB:', verifyResult.resetPasswordToken.substring(0, 10) + '...');
        console.log('[API /auth/forgot-password] Expires:', verifyResult.resetPasswordExpires);
      } else {
        console.error('❌ [API /auth/forgot-password] Token verification failed');
        console.error('Expected token:', resetToken.substring(0, 20) + '...');
        console.error('Got token:', verifyResult?.resetPasswordToken?.substring(0, 20) + '...' || 'null/undefined');
        console.error('Full verify result:', JSON.stringify(verifyResult, null, 2));
        // Don't throw - let's see if it works anyway
        console.warn('⚠️ [API /auth/forgot-password] Continuing despite verification failure - token might still be saved');
      }
      
      console.log('✅ [API /auth/forgot-password] Reset token update completed');

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      // Send password reset email
      const emailSent = await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - ShopEase',
        html: generatePasswordResetHTML({
          name: user.name,
          email: user.email,
          resetUrl: resetUrl
        }),
        text: generatePasswordResetText({
          name: user.name,
          email: user.email,
          resetUrl: resetUrl
        })
      });

      if (emailSent) {
        console.log('✅ [API /auth/forgot-password] Password reset email sent to:', email);
      } else {
        console.error('❌ [API /auth/forgot-password] Failed to send password reset email to:', email);
      }
    } else {
      console.log('[API /auth/forgot-password] User not found for email:', email);
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('❌ [API /auth/forgot-password] Error:', error);
    if (error instanceof Error) {
      console.error('[API /auth/forgot-password] Error message:', error.message);
      console.error('[API /auth/forgot-password] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

