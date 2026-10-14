import { Order, Shop, AppNotification, ClubReport, CampusUser, AvailabilityWindow, ChatConversation } from '../types';

export const campusPickupPoints = [
  { id: 'p1', name: 'Canopy Canteen', area: 'Canopy Canteen', isPublic: true },
  { id: 'p2', name: 'Canopy Lawn', area: 'Canopy Lawn', isPublic: true },
  { id: 'p3', name: 'Library Circle', area: 'Library Circle', isPublic: true },
  { id: 'p4', name: 'Ananda Vihar (Boys’ Hostel)', area: 'Ananda Vihar (Boys’ Hostel)', isPublic: true },
  { id: 'p5', name: 'Vaidehi / VK (Girls’ Hostel)', area: 'Vaidehi / VK (Girls’ Hostel)', isPublic: true },
  { id: 'p6', name: 'Vihar Gate', area: 'Vihar Gate', isPublic: true },
  { id: 'p7', name: 'Main Gate Security', area: 'Main Gate Security', isPublic: true },
  { id: 'p8', name: 'Chanakya / CCC', area: 'Chanakya / CCC', isPublic: true },
  { id: 'p9', name: 'Pharmacy Gate', area: 'Pharmacy Gate', isPublic: true },
  { id: 'p10', name: 'JVC Canteen', area: 'JVC Canteen', isPublic: true },
  { id: 'p11', name: 'Meera Mess Circle', area: 'Meera Mess Circle', isPublic: true },
  { id: 'p12', name: 'Rajalakshmi Circle', area: 'Rajalakshmi Circle', isPublic: true },
  { id: 'p13', name: 'Krishna Circle', area: 'Krishna Circle', isPublic: true },
];

export const sastraHostels = [
  // Boys' Hostels
  'Ananda Vihar (BH)',
  'Vashistha (BH)',
  'Vishwakarma (BH)',
  'Sandipani (BH)',
  'Kanva (BH)',
  'Bharadwaja (BH)',
  'Agasthya (BH)',
  'Parasara (BH)',
  // Girls' Hostels
  'Vaidehi / VK (GH)',
  'Vikasini (GH)',
  'Anusuya (GH)',
  'Arundhati (GH)',
  // Day Scholars
  'Day Scholar (Thanjavur)',
  'Day Scholar (Trichy)',
  'Day Scholar (Kumbakonam)',
  'Day Scholar (Other)',
];

export const prohibitedItemsList = [
  { category: 'Strict Dietary Rule', item: 'All Non-Vegetarian Food Items (Meat, Chicken, Mutton, Fish, Egg, Seafood, Non-Veg Biryani)', reason: 'Strictly prohibited on SASTRA campus premises. Zero-tolerance policy.' },
  { category: 'Substances', item: 'Alcohol & spirits', reason: 'Strictly prohibited on university grounds.' },
  { category: 'Substances', item: 'Tobacco, cigarettes & vape pods', reason: 'Prohibited by college campus regulations.' },
  { category: 'Medicines', item: 'Prescription & scheduled drugs', reason: 'Only over-the-counter paracetamol/band-aids permitted.' },
  { category: 'Safety', item: 'Weapons, knives, fireworks & hazardous fluids', reason: 'Zero-tolerance campus safety regulation.' },
  { category: 'Pilot Caps', item: 'Electronics/valuables exceeding ₹1,500', reason: 'Pilot phase limit to protect student peers.' },
  { category: 'Pilot Caps', item: 'Luggage/packages exceeding 5kg or oversized', reason: 'Helper must be able to carry safely on foot or bike.' }
];

export const mockOrders: Order[] = [];

export const mockShops: Shop[] = [
  {
    id: 'shp-1',
    name: 'Canopy Canteen & Refreshments',
    location: 'Canopy Square, Central Campus',
    distance: '100m from Central Lawn',
    rating: 4.8,
    reviewCount: 94,
    categories: ['Snacks', 'Beverages', 'Food'],
    popularItems: [
      { name: 'Veg Puff & Tea', estimatedPrice: 30 },
      { name: 'Cold Coffee', estimatedPrice: 40 },
      { name: 'Samosa (2 pcs)', estimatedPrice: 25 }
    ],
    verifiedByClub: true
  },
  {
    id: 'shp-2',
    name: 'Central Library Stationery & Reprographics',
    location: 'Ground Floor, Central Library Complex',
    distance: '50m from Library Circle',
    rating: 4.7,
    reviewCount: 112,
    categories: ['Stationery', 'Academic supplies', 'Printing'],
    popularItems: [
      { name: 'A4 Spiral Notebook', estimatedPrice: 60 },
      { name: 'Engineering Calculator FX-82MS', estimatedPrice: 620 },
      { name: 'Blue Gel Pens (Pack of 3)', estimatedPrice: 45 }
    ],
    verifiedByClub: true
  },
  {
    id: 'shp-3',
    name: 'KC Food Court & Juices',
    location: 'Near KRC Block & Sports Complex',
    distance: '300m from Ananda Vihar',
    rating: 4.6,
    reviewCount: 58,
    categories: ['Food', 'Beverages', 'Snacks'],
    popularItems: [
      { name: 'Fresh Fruit Juice', estimatedPrice: 45 },
      { name: 'Veg Sandwich', estimatedPrice: 50 },
      { name: 'Biscuits & Cookies', estimatedPrice: 30 }
    ],
    verifiedByClub: true
  },
  {
    id: 'shp-4',
    name: 'Campus Health Centre & Essentials',
    location: 'Adjacent to Main Gate Security',
    distance: '100m from Main Gate',
    rating: 4.9,
    reviewCount: 46,
    categories: ['Personal care', 'First Aid'],
    popularItems: [
      { name: 'Band-Aid Fabric Strips', estimatedPrice: 30 },
      { name: 'Paracetamol 650mg (OTC strip)', estimatedPrice: 35 },
      { name: 'Hand Sanitizer Pocket Bottle', estimatedPrice: 50 }
    ],
    verifiedByClub: true
  }
];

export const mockNotifications: AppNotification[] = [];

export const mockChats: Record<string, ChatConversation> = {};

export const mockClubReports: ClubReport[] = [
  {
    id: 'REP-301',
    orderReference: 'ORD-1071',
    reporterName: 'Tanvi K.',
    reporterRole: 'customer',
    issueType: 'Item missing or damaged',
    details: 'One glass bottle of iced tea broke inside the bag during helper transit. Helper offered to split, but need guidance on policy.',
    priority: 'High',
    status: 'Open',
    createdAt: 'Today, 2:10 PM',
    timeline: [
      { step: 'Report Submitted', timestamp: 'Today, 2:10 PM', note: 'Customer filed report with photo attachment.' },
      { step: 'Assigned to Moderator', timestamp: 'Today, 2:40 PM', note: 'Club team reviewing chat transcript and receipt.' }
    ]
  },
  {
    id: 'REP-298',
    orderReference: 'ORD-1054',
    reporterName: 'Siddharth M.',
    reporterRole: 'helper',
    issueType: 'No-show at handover',
    details: 'Waited 20 minutes at Central Library Portico. Customer did not show up or reply to alias chat. Released item back to hostel warden desk.',
    priority: 'Medium',
    status: 'Investigating',
    createdAt: 'Yesterday, 8:30 PM',
    timeline: [
      { step: 'Report Submitted', timestamp: 'Yesterday, 8:30 PM', note: 'Helper reported no-show after 20m grace period.' },
      { step: 'Customer Contacted', timestamp: 'Today, 10:15 AM', note: 'Automated notification sent to customer college email.' }
    ]
  },
  {
    id: 'REP-285',
    orderReference: 'ORD-1033',
    reporterName: 'Rahul P.',
    reporterRole: 'customer',
    issueType: 'Price dispute',
    details: 'Helper entered ₹140 for bakery item when menu board says ₹110. Resolved through receipt scan verification.',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '3 days ago',
    timeline: [
      { step: 'Report Submitted', timestamp: '3 days ago', note: 'Customer disputed ₹30 discrepancy.' },
      { step: 'Resolved Manually', timestamp: '2 days ago', note: 'Corrected receipt verified; ₹30 adjusted before final UPI payout.' }
    ]
  }
];

export const mockClubUsers: CampusUser[] = [
  {
    id: 'usr-1',
    name: 'Aarav Sharma',
    collegeEmail: '125004092@sastra.ac.in',
    hostelBlock: 'Block A',
    role: 'customer',
    isVerified: true,
    status: 'Active',
    ordersCount: 8,
    joinedDate: 'Aug 2026'
  },
  {
    id: 'usr-2',
    name: 'Priya Kulkarni',
    collegeEmail: '125004118@sastra.ac.in',
    hostelBlock: 'Block C',
    role: 'helper',
    isVerified: true,
    status: 'Active',
    ordersCount: 24,
    joinedDate: 'Jul 2026'
  },
  {
    id: 'usr-3',
    name: 'Karthik Nambiar',
    collegeEmail: '124008120@sastra.ac.in',
    hostelBlock: 'Block D',
    role: 'helper',
    isVerified: true,
    status: 'Active',
    ordersCount: 19,
    joinedDate: 'Aug 2026'
  },
  {
    id: 'usr-4',
    name: 'Rohan Verma',
    collegeEmail: '125012045@sastra.ac.in',
    hostelBlock: 'Block C',
    role: 'customer',
    isVerified: true,
    status: 'Active',
    ordersCount: 3,
    joinedDate: 'Sep 2026'
  },
  {
    id: 'usr-5',
    name: 'Rajat Mehra',
    collegeEmail: '123005080@sastra.ac.in',
    hostelBlock: 'Unknown',
    role: 'customer',
    isVerified: false,
    status: 'Suspended',
    ordersCount: 0,
    joinedDate: 'Oct 2026'
  }
];

export const mockAvailability: AvailabilityWindow[] = [];
