import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  console.log('[API /auth/reset-password] Reset password request received');
  try {
    await connectDB();
    
    const { token, password } = await request.json();

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    // Note: Even though fields have select: false, we can still query by them
    // We need to explicitly select them to access them after finding
    const now = new Date();
    console.log('[API /auth/reset-password] Looking for token:', token.substring(0, 10) + '...');
    console.log('[API /auth/reset-password] Full token received:', token);
    console.log('[API /auth/reset-password] Current time:', now);
    
    // Query for user with reset token
    // Fields with select: false can still be queried, but we need to explicitly select them to access
    const user = await User.findOne({
      resetPasswordToken: token
    }).select('+resetPasswordToken +resetPasswordExpires +password');
    
    console.log('[API /auth/reset-password] Query result - found user?', !!user);
    
    // If not found, try using the collection directly to bypass any Mongoose select issues
    if (!user) {
      console.log('[API /auth/reset-password] Trying direct MongoDB query...');
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      const collectionName = User.collection.name;
      console.log('[API /auth/reset-password] Using collection:', collectionName);
      const usersCollection = db.collection(collectionName);
      
      // Try querying with the token
      const directResult = await usersCollection.findOne({
        resetPasswordToken: token
      });
      
      console.log('[API /auth/reset-password] Direct MongoDB query result:', directResult ? 'Found user' : 'Not found');
      
      if (directResult) {
        console.log('[API /auth/reset-password] Direct query - User email:', directResult.email);
        console.log('[API /auth/reset-password] Direct query token:', directResult.resetPasswordToken?.substring(0, 10) + '...');
        console.log('[API /auth/reset-password] Direct query expires:', directResult.resetPasswordExpires);
        console.log('[API /auth/reset-password] Direct query - Token match?', directResult.resetPasswordToken === token);
        
        // Check if expired
        if (!directResult.resetPasswordExpires || directResult.resetPasswordExpires <= now) {
          console.log('[API /auth/reset-password] Token has expired');
          return NextResponse.json(
            { error: 'Invalid or expired reset token' },
            { status: 400 }
          );
        }
        
        // Update password directly using native MongoDB
        const updateResult = await usersCollection.updateOne(
          { _id: directResult._id },
          {
            $set: { password: password }, // Will be hashed by pre-save if we use User model
            $unset: { resetPasswordToken: '', resetPasswordExpires: '' }
          }
        );
        
        // Actually, we need to hash the password, so let's use the User model
        const userDoc = await User.findById(directResult._id).select('+password +resetPasswordToken +resetPasswordExpires');
        if (userDoc) {
          userDoc.password = password;
          userDoc.resetPasswordToken = undefined;
          userDoc.resetPasswordExpires = undefined;
          await userDoc.save();
          console.log('✅ [API /auth/reset-password] Password reset successful for:', userDoc.email);
          return NextResponse.json({
            message: 'Password has been reset successfully. You can now login with your new password.'
          });
        }
      } else {
        // Try to find ANY user with a reset token to debug
        const anyUser = await usersCollection.findOne({ resetPasswordToken: { $exists: true } });
        if (anyUser) {
          console.log('[API /auth/reset-password] Found a user with a token (different):', anyUser.email);
          console.log('[API /auth/reset-password] Their token:', anyUser.resetPasswordToken?.substring(0, 20) + '...');
          console.log('[API /auth/reset-password] Looking for token:', token.substring(0, 20) + '...');
          console.log('[API /auth/reset-password] Tokens match?', anyUser.resetPasswordToken === token);
        } else {
          console.log('[API /auth/reset-password] No users found with ANY reset token in collection');
        }
      }
    }

    if (!user) {
      console.log('[API /auth/reset-password] No user found with this token');
      // Try to find any user with a reset token to debug
      const anyUserWithToken = await User.findOne({ resetPasswordToken: { $exists: true } })
        .select('+resetPasswordToken +resetPasswordExpires');
      if (anyUserWithToken) {
        console.log('[API /auth/reset-password] Found a user with a token (different one):', anyUserWithToken.email);
        console.log('[API /auth/reset-password] Their token:', anyUserWithToken.resetPasswordToken?.substring(0, 10) + '...');
        console.log('[API /auth/reset-password] Token match?', anyUserWithToken.resetPasswordToken === token);
      } else {
        console.log('[API /auth/reset-password] No users found with any reset token');
      }
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('[API /auth/reset-password] User found:', user.email);
    console.log('[API /auth/reset-password] Token expires:', user.resetPasswordExpires);
    console.log('[API /auth/reset-password] Is expired?', user.resetPasswordExpires ? user.resetPasswordExpires <= now : 'N/A');

    // Check if token is expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires <= now) {
      console.log('[API /auth/reset-password] Token has expired');
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('[API /auth/reset-password] Token validated successfully for user:', user.email);

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Save user (password will be hashed by pre-save hook)
    await user.save();

    console.log('✅ [API /auth/reset-password] Password reset successful for:', user.email);

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ [API /auth/reset-password] Error:', error);
    if (error instanceof Error) {
      console.error('[API /auth/reset-password] Error message:', error.message);
      console.error('[API /auth/reset-password] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

