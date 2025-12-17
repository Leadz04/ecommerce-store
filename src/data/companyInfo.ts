export const companyInfo = {
  name: 'EverStyleCrafts',
  legalName: 'EverStyleCrafts',
  tagline: 'Premium handcrafted leather goods from Sialkot',
  description:
    'EverStyleCrafts curates premium Pakistani leather goods, travel accessories, and gifting essentials crafted for everyday sophistication.',
  email: 'testleadz04@gmail.com',
  phone: '+923042158396',
  supportHours: 'Monday – Saturday, 10:00 AM – 8:00 PM PKT',
  address: 'Al Hayat Center, Shop #12, Near Citi Housing Society Gate, Daska Road, Sialkot, Pakistan',
  returnAddress: 'Al Hayat Center, Shop #12, Daska Road, Sialkot',
  siteUrl: 'https://everstylecrafts.com',
  whatsapp: '+923042158396',
  domesticShipping: {
    freeThreshold: 'Rs 7,500',
    standardFee: 'Rs 299',
    expressFee: 'Rs 699',
    standardTimeline: '2-4 business days across Pakistan',
    expressTimeline: '1-2 business days for major cities',
  },
  internationalShipping: {
    middleEastTimeline: '5-8 business days',
    europeTimeline: '7-12 business days',
  },
};

export type CompanyInfo = typeof companyInfo;


