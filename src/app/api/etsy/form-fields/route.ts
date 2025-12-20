import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EtsyFormField from '@/models/EtsyFormField';
import { getCurrentUserId } from '@/lib/etsy-auth-helper';

// Static form field definitions with help text
const STATIC_FORM_FIELDS = {
  listings: [
    {
      fieldKey: 'title',
      fieldName: 'Title',
      fieldType: 'text' as const,
      description: 'The title of your listing. Keep it concise and descriptive (10-140 characters).',
      placeholder: 'Enter listing title',
      required: true,
      minLength: 10,
      maxLength: 140,
      helpText: 'Use keywords that buyers might search for. Avoid keyword stuffing.',
      example: 'Handmade Leather Wallet - Brown Genuine Leather'
    },
    {
      fieldKey: 'description',
      fieldName: 'Description',
      fieldType: 'textarea' as const,
      description: 'Detailed description of your product. Include materials, dimensions, care instructions, and shipping info.',
      placeholder: 'Enter listing description',
      required: true,
      minLength: 200,
      maxLength: 5000,
      helpText: 'Write naturally and include essential information at the top. Use paragraphs and bullet points for readability.',
      example: 'This beautiful handmade wallet is crafted from genuine leather...'
    },
    {
      fieldKey: 'price',
      fieldName: 'Price',
      fieldType: 'number' as const,
      description: 'The price of your item in your shop\'s currency.',
      placeholder: '0.00',
      required: true,
      min: 0.01,
      helpText: 'Price should be competitive and include any applicable taxes.',
      example: '29.99'
    },
    {
      fieldKey: 'quantity',
      fieldName: 'Quantity',
      fieldType: 'number' as const,
      description: 'The number of items available for sale.',
      placeholder: '1',
      required: true,
      min: 1,
      helpText: 'Update this regularly to reflect your actual inventory.',
      example: '5'
    },
    {
      fieldKey: 'taxonomy_id',
      fieldName: 'Taxonomy ID',
      fieldType: 'number' as const,
      description: 'The Etsy taxonomy category ID for your product. Use the Taxonomy Research section to find the correct ID.',
      placeholder: 'e.g., 691',
      required: true,
      min: 1,
      helpText: 'This determines which product properties and scales are available for your listing.',
      example: '691'
    },
    {
      fieldKey: 'who_made',
      fieldName: 'Who Made',
      fieldType: 'select' as const,
      description: 'Who made this item?',
      required: true,
      options: [
        { value: 'i_did', label: 'I did' },
        { value: 'someone_else', label: 'Someone else' },
        { value: 'collective', label: 'Collective' }
      ],
      helpText: 'Select who made the item. This affects how your listing appears in search.',
      example: 'i_did'
    },
    {
      fieldKey: 'when_made',
      fieldName: 'When Made',
      fieldType: 'select' as const,
      description: 'When was this item made?',
      required: true,
      options: [
        { value: 'made_to_order', label: 'Made to order' },
        { value: '2020_2025', label: '2020-2025' },
        { value: '2010_2019', label: '2010-2019' },
        { value: '2006_2009', label: '2006-2009' },
        { value: 'before_2006', label: 'Before 2006' }
      ],
      helpText: 'Select when the item was made. For vintage items, choose the appropriate decade.',
      example: 'made_to_order'
    },
    {
      fieldKey: 'tags',
      fieldName: 'Tags',
      fieldType: 'text' as const,
      description: 'Comma-separated tags (up to 13 tags). Use specific, descriptive phrases.',
      placeholder: 'tag1, tag2, tag3',
      required: false,
      maxLength: 260,
      helpText: 'Use all 13 tags if possible. Each tag can be up to 20 characters. Use multi-word phrases.',
      example: 'handmade wallet, leather wallet, brown leather, gift for him'
    },
    {
      fieldKey: 'materials',
      fieldName: 'Materials',
      fieldType: 'text' as const,
      description: 'Comma-separated list of materials used in this item.',
      placeholder: 'cotton, silk, etc.',
      required: false,
      helpText: 'List all materials used. This helps buyers find your item and understand what it\'s made of.',
      example: 'genuine leather, metal zipper, cotton lining'
    },
    {
      fieldKey: 'is_supply',
      fieldName: 'Is Supply',
      fieldType: 'checkbox' as const,
      description: 'Check if this is a supply item (materials, tools, etc.) rather than a finished product.',
      required: false,
      helpText: 'Supplies are materials or tools used to make other items.',
      example: false
    },
    {
      fieldKey: 'shipping_profile_id',
      fieldName: 'Shipping Profile',
      fieldType: 'select' as const,
      description: 'Select a shipping profile that defines shipping costs and delivery times.',
      required: false,
      helpText: 'Shipping profiles help you manage shipping settings across multiple listings.',
      example: ''
    },
    {
      fieldKey: 'shop_section_id',
      fieldName: 'Shop Section',
      fieldType: 'select' as const,
      description: 'Organize your listing into a shop section.',
      required: false,
      helpText: 'Sections help organize your shop and make it easier for buyers to browse.',
      example: ''
    },
    {
      fieldKey: 'return_policy_id',
      fieldName: 'Return Policy',
      fieldType: 'select' as const,
      description: 'Select a return policy for this listing.',
      required: false,
      helpText: 'Return policies set buyer expectations and can help build trust.',
      example: ''
    },
    {
      fieldKey: 'processing_min',
      fieldName: 'Processing Min (days)',
      fieldType: 'number' as const,
      description: 'Minimum processing time in days before shipping.',
      placeholder: 'e.g., 5',
      required: false,
      min: 1,
      helpText: 'Set realistic processing times. Buyers appreciate accurate estimates.',
      example: '5'
    },
    {
      fieldKey: 'processing_max',
      fieldName: 'Processing Max (days)',
      fieldType: 'number' as const,
      description: 'Maximum processing time in days before shipping.',
      placeholder: 'e.g., 7',
      required: false,
      min: 1,
      helpText: 'Set realistic processing times. Buyers appreciate accurate estimates.',
      example: '7'
    },
    {
      fieldKey: 'item_weight',
      fieldName: 'Item Weight',
      fieldType: 'number' as const,
      description: 'Weight of the item.',
      placeholder: '0.00',
      required: false,
      min: 0,
      helpText: 'Accurate weight helps calculate shipping costs correctly.',
      example: '0.5'
    },
    {
      fieldKey: 'item_weight_unit',
      fieldName: 'Weight Unit',
      fieldType: 'select' as const,
      description: 'Unit for item weight.',
      required: false,
      options: [
        { value: 'oz', label: 'oz' },
        { value: 'lb', label: 'lb' },
        { value: 'g', label: 'g' },
        { value: 'kg', label: 'kg' }
      ],
      helpText: 'Select the unit of measurement for weight.',
      example: 'lb'
    },
    {
      fieldKey: 'item_length',
      fieldName: 'Length',
      fieldType: 'number' as const,
      description: 'Length of the item.',
      placeholder: '0.00',
      required: false,
      min: 0,
      helpText: 'Accurate dimensions help buyers understand the size of your item.',
      example: '10'
    },
    {
      fieldKey: 'item_width',
      fieldName: 'Width',
      fieldType: 'number' as const,
      description: 'Width of the item.',
      placeholder: '0.00',
      required: false,
      min: 0,
      helpText: 'Accurate dimensions help buyers understand the size of your item.',
      example: '8'
    },
    {
      fieldKey: 'item_height',
      fieldName: 'Height',
      fieldType: 'number' as const,
      description: 'Height of the item.',
      placeholder: '0.00',
      required: false,
      min: 0,
      helpText: 'Accurate dimensions help buyers understand the size of your item.',
      example: '2'
    },
    {
      fieldKey: 'item_dimensions_unit',
      fieldName: 'Dimensions Unit',
      fieldType: 'select' as const,
      description: 'Unit for item dimensions.',
      required: false,
      options: [
        { value: 'in', label: 'inches' },
        { value: 'ft', label: 'feet' },
        { value: 'mm', label: 'mm' },
        { value: 'cm', label: 'cm' },
        { value: 'm', label: 'm' },
        { value: 'yd', label: 'yards' }
      ],
      helpText: 'Select the unit of measurement for dimensions.',
      example: 'in'
    },
    {
      fieldKey: 'is_personalizable',
      fieldName: 'Is Personalizable',
      fieldType: 'checkbox' as const,
      description: 'Check if buyers can personalize this item.',
      required: false,
      helpText: 'Personalization allows buyers to add custom text or choose options.',
      example: false
    },
    {
      fieldKey: 'personalization_is_required',
      fieldName: 'Personalization Required',
      fieldType: 'checkbox' as const,
      description: 'Require buyers to provide personalization details.',
      required: false,
      helpText: 'If checked, buyers must provide personalization information before purchasing.',
      example: false
    },
    {
      fieldKey: 'personalization_char_count_max',
      fieldName: 'Max Character Count',
      fieldType: 'number' as const,
      description: 'Maximum number of characters for personalization.',
      placeholder: 'e.g., 256',
      required: false,
      min: 1,
      helpText: 'Set a reasonable limit for personalization text.',
      example: '256'
    },
    {
      fieldKey: 'personalization_instructions',
      fieldName: 'Personalization Instructions',
      fieldType: 'textarea' as const,
      description: 'Instructions for buyers on how to personalize this item.',
      placeholder: 'Instructions for buyers',
      required: false,
      helpText: 'Clear instructions help buyers understand what personalization options are available.',
      example: 'Enter the text you want engraved (max 20 characters)'
    },
    {
      fieldKey: 'is_taxable',
      fieldName: 'Is Taxable',
      fieldType: 'checkbox' as const,
      description: 'Check if this item is subject to sales tax.',
      required: false,
      helpText: 'Tax rules vary by location. Check your local tax requirements.',
      example: false
    },
    {
      fieldKey: 'should_auto_renew',
      fieldName: 'Auto-Renew',
      fieldType: 'checkbox' as const,
      description: 'Automatically renew this listing when it expires.',
      required: false,
      helpText: 'Auto-renewal keeps your listings active without manual intervention.',
      example: false
    },
    {
      fieldKey: 'featured_rank',
      fieldName: 'Featured Rank',
      fieldType: 'number' as const,
      description: 'Featured rank for shop homepage (lower numbers appear first).',
      placeholder: 'Optional',
      required: false,
      min: 1,
      helpText: 'Featured listings appear on your shop homepage. Lower numbers appear first.',
      example: '1'
    },
    {
      fieldKey: 'state',
      fieldName: 'Listing State',
      fieldType: 'select' as const,
      description: 'Current state of the listing.',
      required: false,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      helpText: 'Draft listings are not visible to buyers. Active listings appear in search.',
      example: 'draft'
    }
  ],
  shipping: [
    {
      fieldKey: 'title',
      fieldName: 'Profile Title',
      fieldType: 'text' as const,
      description: 'Name for this shipping profile.',
      placeholder: 'e.g., Standard Shipping',
      required: true,
      helpText: 'Choose a descriptive name that helps you identify this profile.',
      example: 'Standard Shipping'
    },
    {
      fieldKey: 'min_processing_time',
      fieldName: 'Min Processing Time',
      fieldType: 'number' as const,
      description: 'Minimum processing time in business days.',
      placeholder: '1',
      required: true,
      min: 1,
      helpText: 'Set realistic processing times based on your production schedule.',
      example: '1'
    },
    {
      fieldKey: 'max_processing_time',
      fieldName: 'Max Processing Time',
      fieldType: 'number' as const,
      description: 'Maximum processing time in business days.',
      placeholder: '3',
      required: true,
      min: 1,
      helpText: 'Set realistic processing times based on your production schedule.',
      example: '3'
    },
    {
      fieldKey: 'origin_country_iso',
      fieldName: 'Origin Country',
      fieldType: 'select' as const,
      description: 'Country where items ship from.',
      required: true,
      options: [
        { value: 'US', label: 'United States' },
        { value: 'CA', label: 'Canada' },
        { value: 'GB', label: 'United Kingdom' },
        { value: 'AU', label: 'Australia' }
      ],
      helpText: 'Select the country where you ship items from.',
      example: 'US'
    }
  ],
  sections: [
    {
      fieldKey: 'title',
      fieldName: 'Section Title',
      fieldType: 'text' as const,
      description: 'Name for this shop section.',
      placeholder: 'e.g., Handmade Jewelry',
      required: true,
      helpText: 'Choose a clear, descriptive name for your shop section.',
      example: 'Handmade Jewelry'
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Note: userId is not required for fetching form field metadata
    // but we keep the auth check for consistency
    try {
      await getCurrentUserId(request);
    } catch {
      // Allow unauthenticated access to form field metadata
    }
    
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    
    // Get fields from DB
    const query: any = {};
    if (section) {
      query.section = section;
    }
    
    let fields = await EtsyFormField.find(query).lean();
    
    // If no fields in DB for requested section, use static values
    if (fields.length === 0 && section && STATIC_FORM_FIELDS[section as keyof typeof STATIC_FORM_FIELDS]) {
      const staticFields = STATIC_FORM_FIELDS[section as keyof typeof STATIC_FORM_FIELDS];
      
      // Save static fields to DB
      for (const field of staticFields) {
        await EtsyFormField.findOneAndUpdate(
          { section, fieldKey: field.fieldKey },
          {
            ...field,
            lastSyncedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }
      
      // Fetch again from DB
      fields = await EtsyFormField.find(query).lean();
    } else if (fields.length === 0 && !section) {
      // Initialize all sections with static data
      for (const [sectionKey, sectionFields] of Object.entries(STATIC_FORM_FIELDS)) {
        for (const field of sectionFields) {
          await EtsyFormField.findOneAndUpdate(
            { section: sectionKey, fieldKey: field.fieldKey },
            {
              ...field,
              lastSyncedAt: new Date()
            },
            { upsert: true, new: true }
          );
        }
      }
      fields = await EtsyFormField.find({}).lean();
    }
    
    return NextResponse.json({
      success: true,
      fields: fields.map(f => ({
        ...f,
        _id: undefined,
        __v: undefined
      }))
    });
  } catch (error: any) {
    console.error('Error fetching form fields:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch form fields' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const userId = await getCurrentUserId(request);
    
    const body = await request.json();
    const { section, fields } = body;
    
    if (!section || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Section and fields array are required' },
        { status: 400 }
      );
    }
    
    // Upsert fields
    const results = [];
    for (const field of fields) {
      const result = await EtsyFormField.findOneAndUpdate(
        { section, fieldKey: field.fieldKey },
        {
          ...field,
          section,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );
      results.push(result);
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} form fields`,
      fields: results
    });
  } catch (error: any) {
    console.error('Error updating form fields:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update form fields' },
      { status: 500 }
    );
  }
}
