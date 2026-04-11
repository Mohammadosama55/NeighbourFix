import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Complaint from './models/Complaint.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neighbourfix';

// ── Realistic Indian complaint data ──────────────────────────────────────────

const roadComplaints = [
  { title: 'Large potholes on main market road', description: 'Multiple deep potholes near the main market entrance causing accidents. Two-wheelers have fallen. Urgent repair needed before monsoon.' },
  { title: 'Road completely broken near school zone', description: 'The road leading to Government Primary School is badly damaged. Children are at risk while crossing. Parents are very concerned.' },
  { title: 'Speed breaker missing on highway crossing', description: 'The speed breaker that existed before was removed during road widening but never replaced. Vehicles crossing at very high speed near the residential area.' },
  { title: 'Footpath encroached by vendors', description: 'The footpath on the main road is completely occupied by vendors leaving pedestrians to walk on the road. Dangerous especially for elderly and children.' },
  { title: 'Road caving in near drain', description: 'The road surface is slowly caving in adjacent to the storm drain. If not repaired immediately it will become a sinkhole during rains.' },
  { title: 'No road markings at busy junction', description: 'Road markings have completely faded at the Sector 14 junction. This causes confusion for drivers and frequent minor accidents.' },
  { title: 'Broken divider on arterial road', description: 'The concrete divider on the arterial road has broken into pieces. Rubble is on the road and poses serious hazard to motorcyclists at night.' },
  { title: 'Pothole damaged my vehicle - no action for 3 months', description: 'I reported this pothole 3 months ago. The municipal corporation acknowledged it but no repair work has started. My car was badly damaged.' },
  { title: 'Road waterlogging every monsoon', description: 'This stretch of road gets completely waterlogged every year during monsoon. The underlying drainage issue has never been addressed despite repeated complaints.' },
  { title: 'Footpath tiles broken and dangerous', description: 'Footpath tiles near the bus stop are broken and uneven. An elderly woman slipped and fell last week. Immediate replacement needed.' },
  { title: 'No street lights on 2km stretch of road', description: 'The entire 2km stretch from the flyover to the colony gate has no functional street lights. Accidents and incidents of theft are increasing at night.' },
  { title: 'Construction debris dumped on road for weeks', description: 'A contractor has dumped construction material on the road for over 3 weeks. Only one lane is usable causing severe traffic jams during peak hours.' },
  { title: 'Road repair done poorly — already breaking', description: 'The road was supposedly repaired 2 months ago but is already crumbling. Poor quality material was used. This is a waste of public money.' },
  { title: 'Encroachment shrinking road width', description: 'Illegal construction by a property owner has reduced the road width from 12 feet to 6 feet. Vehicles cannot pass each other without going onto the opposite side.' },
  { title: 'Missing manhole cover on busy road', description: 'A manhole cover is completely missing on the main road. It has been covered with a piece of wood which gets displaced by vehicles. Very dangerous.' },
];

const waterComplaints = [
  { title: 'No water supply for past 5 days', description: 'Our entire colony has had no water supply for 5 consecutive days. The tanker comes once in 2 days but quantity is insufficient for 200 families.' },
  { title: 'Contaminated water coming from taps', description: 'The tap water has turned yellowish-brown and has a foul smell. Several residents including children have fallen ill. Please test and fix urgently.' },
  { title: 'Water pipeline leaking for 2 weeks', description: 'A major water pipeline is leaking near the colony entrance. Thousands of litres are being wasted daily. The road is also getting damaged due to waterlogging.' },
  { title: 'Water pressure extremely low in upper floors', description: 'Residents on 3rd floor and above get virtually no water pressure. We cannot fill our tanks. The booster pump installed previously seems to have failed.' },
  { title: 'Broken water meter showing wrong readings', description: 'My water meter is clearly broken — it shows double the usage compared to last year even though we have the same family size. Requesting inspection and replacement.' },
  { title: 'Water supply timings changed without notice', description: 'The water supply timings were changed without any prior notice. Many residents missed filling their tanks. Regular and consistent timing must be maintained.' },
  { title: 'Public tap non-functional for 3 months', description: 'The public water tap near the slum area has not been functional for 3 months. Over 50 families depend on this tap. They are buying expensive water cans.' },
  { title: 'Water mixing with sewage in our area', description: 'Residents have complained about stomach illnesses. We believe water supply pipes are mixing with sewage lines. This is a serious health hazard.' },
  { title: 'Old rusty pipes causing discoloured water', description: 'The water distribution pipes in our area are very old and rusted. The water that comes is clearly contaminated. Old pipes need to be replaced immediately.' },
  { title: 'No water connection given despite paying fees', description: 'We paid for new water connection 6 months ago and got a receipt but no connection has been given yet. Multiple visits to the office have been useless.' },
];

const garbageComplaints = [
  { title: 'Garbage not collected for 10 days', description: 'The garbage collection vehicle has not come to our street for 10 days. Garbage is piling up and stray animals are spreading it further creating a health hazard.' },
  { title: 'Illegal dumping ground behind our colony', description: 'People from the main road have started using the vacant plot behind our colony as an illegal dumping ground. The smell is unbearable especially in summer.' },
  { title: 'Garbage bins overflowing on market street', description: 'All three garbage bins on the market street are overflowing. They haven\'t been emptied in days. Flies and mosquitoes are everywhere. Shoppers are complaining.' },
  { title: 'Construction waste dumped near park', description: 'Someone dumped a truck full of construction waste near the children\'s park. Children cannot play there now. The culprit should be identified and fined.' },
  { title: 'No dust bins in entire 2km stretch', description: 'There are no dustbins provided along the 2km walking track near the lake. People end up littering. Installing dustbins will help keep the area clean.' },
  { title: 'Garbage burning causing air pollution', description: 'Unidentified people are burning garbage in the open plot near our houses every evening. The smoke is causing respiratory issues especially for asthma patients.' },
  { title: 'Sweeper not coming to our lane for weeks', description: 'The municipal sweeper has not cleaned our lane in over 3 weeks. The dirt and leaves are piling up. We are paying taxes but getting no services.' },
  { title: 'Dead animals not being removed', description: 'A dead dog has been lying on the roadside for 4 days. The corporation\'s animal removal team has not responded despite two complaints. Serious health risk.' },
  { title: 'Hospital waste dumped in open', description: 'Medical waste including used syringes and bandages are being found in the open area near the small clinic. This is illegal and extremely dangerous.' },
  { title: 'Wet and dry waste not being separated', description: 'The garbage collectors are mixing wet and dry waste despite the segregation drive. This defeats the entire purpose. They need to be trained and monitored.' },
];

const drainageComplaints = [
  { title: 'Drain overflowing into homes during rain', description: 'Every time it rains, the storm drain overflows and water enters our ground floor homes. We have complained twice before but no permanent fix has been done.' },
  { title: 'Open drain without cover near school', description: 'There is an open drain running along the school boundary wall. Children are at risk of falling in. This drain needs to be covered immediately.' },
  { title: 'Blocked drain causing sewage overflow', description: 'The main drain is blocked causing raw sewage to overflow onto the road. The stench is terrible and it is a serious health hazard for the entire neighbourhood.' },
  { title: 'Drain cleaning not done before monsoon', description: 'It is already June and the municipal team has not cleaned the drains in our area. They get blocked every year causing flooding. Preventive cleaning needed urgently.' },
  { title: 'Sewage water stagnant for weeks', description: 'Sewage water has been stagnant near our colony gate for weeks. Mosquitoes are breeding there. Two residents have already been diagnosed with dengue.' },
  { title: 'New construction blocked existing drainage', description: 'A new building under construction has blocked the natural drainage path. Now our area floods even with light rain. The developer must rectify this.' },
  { title: 'Drain wall collapsed onto road', description: 'The retaining wall of the main drain has collapsed onto the road. Debris is on the road and the drain is exposed. Both need to be fixed urgently.' },
  { title: 'Storm water drain not connected properly', description: 'The storm water drainage system in our new housing society was not connected to the main drain properly. Our park and parking get flooded after every rain.' },
  { title: 'Mosquito breeding in stagnant drain water', description: 'Water has been stagnant in the drain near our apartments for over a month. Mosquito breeding is rampant. Cases of dengue and chikungunya are increasing in the area.' },
  { title: 'Drainage causing foul smell in entire area', description: 'The blocked drainage system near the market is producing a terrible smell that makes it difficult to operate our shops. Customers avoid coming because of the smell.' },
];

const powerComplaints = [
  { title: 'Frequent power cuts affecting entire ward', description: 'Our ward faces 4-6 hours of unscheduled power cuts daily. No advance notice is given. This is affecting home businesses, students studying for exams, and daily life.' },
  { title: 'Transformer damaged — no power for 2 days', description: 'The local transformer was damaged in last night\'s storm. The entire block has had no power for 2 days. DISCOM team came but said they don\'t have spare parts.' },
  { title: 'Dangling live wire on road — danger to life', description: 'A live electric wire has fallen and is hanging dangerously low on the road after the storm. Vehicles and pedestrians are passing under it. Immediate action needed.' },
  { title: 'Street lights non-functional for 1 month', description: 'All 12 street lights in our lane have been non-functional for over a month. The area is completely dark at night. Incidents of chain snatching have increased.' },
  { title: 'Electric pole leaning dangerously', description: 'An electric pole near the children\'s play area is leaning at a dangerous angle. The cables are also sagging. It could fall any day causing serious injuries.' },
  { title: 'Wrong electricity bill — 5x normal amount', description: 'I received a bill of ₹15,000 this month when my normal bill is around ₹3,000. I suspect meter tampering or a clerical error. Requesting immediate inspection.' },
  { title: 'No power connection despite repeated applications', description: 'I applied for a new electricity connection 8 months ago, paid all charges, but still no connection. The DISCOM office keeps giving excuses and asking for more documents.' },
  { title: 'Illegal power connections causing overload', description: 'Multiple illegal power connections in our area are causing overload and frequent tripping. The licensed connections suffer because of these unauthorised connections.' },
  { title: 'Earth wire missing on power lines', description: 'The earth wire on our street\'s power lines is missing or disconnected. During rains, metal fences and gates are giving electric shocks. Very dangerous situation.' },
  { title: 'Voltage fluctuation damaging home appliances', description: 'Extreme voltage fluctuations in our area have damaged a refrigerator, washing machine, and TV in our home alone. Many neighbours face the same problem. Stabilisers are not enough.' },
];

const otherComplaints = [
  { title: 'Stray dog menace — residents afraid to go out', description: 'A pack of aggressive stray dogs has been terrorising residents especially in the evenings. Two people have been bitten. Animal control needs to act immediately.' },
  { title: 'Park maintained poorly — facilities broken', description: 'The public park has not been maintained for months. Swings are broken, benches are damaged, and the grass is overgrown. Senior citizens and children cannot use it.' },
  { title: 'Encroachment on public land near market', description: 'A shop owner has illegally encroached on the public footpath and extended his shop. This is reducing the space for pedestrians and blocking emergency vehicle access.' },
  { title: 'Noise pollution from factory at night', description: 'A factory in the area is running heavy machinery throughout the night causing unbearable noise. Residents cannot sleep and children\'s studies are getting affected.' },
  { title: 'School bus stops blocking road every morning', description: 'Multiple school buses park in the middle of the road for 30-40 minutes during school drop time causing massive traffic jams. A proper bus bay needs to be created.' },
  { title: 'Public toilet non-functional and dirty', description: 'The public toilet near the bus stand has not been cleaned in weeks and the taps are broken. It has become unusable. Women especially are facing problems.' },
  { title: 'Unauthorised construction without permit', description: 'My neighbour is constructing an additional floor without any building permit. I have complained to the municipal office but no action has been taken in 2 months.' },
  { title: 'Trees not trimmed — branches blocking road', description: 'Overgrown tree branches are blocking the road and traffic signals on the main street. Tall vehicles cannot pass safely. Pruning should be done immediately.' },
  { title: 'Advertisement hoardings blocking road visibility', description: 'Large illegal hoardings at the junction are blocking visibility for drivers. Several near-miss accidents have occurred. These unauthorised hoardings must be removed.' },
  { title: 'Community hall locked — not available to residents', description: 'The community hall that belongs to all residents is being controlled by a local group that locks it and charges for usage. We want free access as per municipal rules.' },
];

// ── Location data (Delhi/NCR spread) ────────────────────────────────────────
const locations = [
  { area: 'Sector 14, Dwarka', coords: [77.0595, 28.5921] },
  { area: 'Rohini Sector 3', coords: [77.1130, 28.7040] },
  { area: 'Laxmi Nagar', coords: [77.2766, 28.6313] },
  { area: 'Janakpuri West', coords: [77.0826, 28.6289] },
  { area: 'Saket Block C', coords: [77.2167, 28.5245] },
  { area: 'Mayur Vihar Phase 1', coords: [77.2960, 28.6080] },
  { area: 'Patparganj', coords: [77.2953, 28.6217] },
  { area: 'Vasundhara Enclave', coords: [77.3149, 28.6170] },
  { area: 'Pitampura Sector 24', coords: [77.1310, 28.7000] },
  { area: 'Uttam Nagar', coords: [77.0585, 28.6196] },
  { area: 'Shahdara Main Road', coords: [77.2891, 28.6702] },
  { area: 'Tilak Nagar', coords: [77.0979, 28.6418] },
  { area: 'Karol Bagh Extension', coords: [77.1926, 28.6514] },
  { area: 'Patel Nagar', coords: [77.1620, 28.6531] },
  { area: 'Rajouri Garden', coords: [77.1199, 28.6454] },
  { area: 'Tagore Garden', coords: [77.1052, 28.6480] },
  { area: 'Subhash Nagar', coords: [77.1099, 28.6380] },
  { area: 'Punjabi Bagh East', coords: [77.1381, 28.6693] },
  { area: 'Model Town Block A', coords: [77.1933, 28.7164] },
  { area: 'Shalimar Bagh Sector 14', coords: [77.1618, 28.7133] },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(6, 22), randomInt(0, 59));
  return d;
}

function jitter(coord) {
  return coord + (Math.random() - 0.5) * 0.02;
}

async function seed() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // ── Clear existing demo data ──────────────────────────────────────────────
  await Complaint.deleteMany({});
  await User.deleteMany({ email: { $in: [
    'admin@neighbourfix.com',
    'ravi.kumar@example.com',
    'priya.sharma@example.com',
    'amit.verma@example.com',
    'sunita.patel@example.com',
    'deepak.singh@example.com',
  ]}});

  console.log('Old demo data cleared.');

  // ── Create users ──────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Demo@1234', 10);

  const admin = await User.create({
    name: 'Ward Admin',
    email: 'admin@neighbourfix.com',
    password,
    role: 'ward_admin',
    wardNumber: '1',
    phone: '9810001001',
  });

  const residents = await User.create([
    { name: 'Ravi Kumar', email: 'ravi.kumar@example.com', password, role: 'resident', wardNumber: '3', phone: '9810001002' },
    { name: 'Priya Sharma', email: 'priya.sharma@example.com', password, role: 'resident', wardNumber: '7', phone: '9810001003' },
    { name: 'Amit Verma', email: 'amit.verma@example.com', password, role: 'resident', wardNumber: '12', phone: '9810001004' },
    { name: 'Sunita Patel', email: 'sunita.patel@example.com', password, role: 'resident', wardNumber: '5', phone: '9810001005' },
    { name: 'Deepak Singh', email: 'deepak.singh@example.com', password, role: 'resident', wardNumber: '9', phone: '9810001006' },
  ]);

  console.log(`Created ${residents.length + 1} users.`);

  // ── Build complaint pool ──────────────────────────────────────────────────
  const pool = [
    ...roadComplaints.map(c => ({ ...c, category: 'road' })),
    ...waterComplaints.map(c => ({ ...c, category: 'water' })),
    ...garbageComplaints.map(c => ({ ...c, category: 'garbage' })),
    ...drainageComplaints.map(c => ({ ...c, category: 'drainage' })),
    ...powerComplaints.map(c => ({ ...c, category: 'power' })),
    ...otherComplaints.map(c => ({ ...c, category: 'other' })),
  ];

  const allUsers = [admin, ...residents];
  const statuses = ['reported', 'reported', 'reported', 'in_progress', 'in_progress', 'resolved', 'rejected'];
  const complaints = [];

  for (let i = 0; i < pool.length; i++) {
    const item = pool[i];
    const loc = locations[i % locations.length];
    const reporter = allUsers[i % allUsers.length];
    const status = statuses[i % statuses.length];
    const upvotes = status === 'resolved' ? randomInt(8, 40)
      : status === 'in_progress' ? randomInt(4, 20)
      : randomInt(0, 15);
    const escalated = upvotes >= 10;
    const wardNum = String(randomInt(1, 20));
    const createdAt = randomDate(120);

    // give some upvoters
    const upvoterIds = [];
    for (let u = 0; u < Math.min(upvotes, allUsers.length); u++) {
      upvoterIds.push(allUsers[u]._id);
    }

    const doc = {
      title: item.title,
      description: item.description,
      category: item.category,
      wardNumber: wardNum,
      address: `${loc.area}, Ward ${wardNum}`,
      location: {
        type: 'Point',
        coordinates: [jitter(loc.coords[0]), jitter(loc.coords[1])],
      },
      status,
      upvotes,
      upvotedBy: upvoterIds,
      reportedBy: reporter._id,
      escalated,
      escalationEmailSent: escalated,
      escalationDate: escalated ? createdAt : undefined,
      photos: [],
      createdAt,
      updatedAt: createdAt,
      ...(status === 'resolved' ? {
        resolutionNotes: 'Issue has been inspected and resolved by the municipal team. Work completion certificate uploaded.',
        resolvedAt: new Date(createdAt.getTime() + randomInt(3, 30) * 86400000),
      } : {}),
    };

    complaints.push(doc);
  }

  // Extra filler to reach 100+
  while (complaints.length < 105) {
    const base = pool[complaints.length % pool.length];
    const loc = locations[complaints.length % locations.length];
    const reporter = allUsers[complaints.length % allUsers.length];
    const status = statuses[complaints.length % statuses.length];
    const upvotes = randomInt(0, 18);
    const wardNum = String(randomInt(1, 20));
    const createdAt = randomDate(180);

    complaints.push({
      title: base.title + ' (Block ' + (complaints.length + 1) + ')',
      description: base.description,
      category: base.category,
      wardNumber: wardNum,
      address: `${loc.area}, Ward ${wardNum}`,
      location: {
        type: 'Point',
        coordinates: [jitter(loc.coords[0]), jitter(loc.coords[1])],
      },
      status,
      upvotes,
      upvotedBy: allUsers.slice(0, Math.min(upvotes, allUsers.length)).map(u => u._id),
      reportedBy: reporter._id,
      escalated: upvotes >= 10,
      escalationEmailSent: upvotes >= 10,
      photos: [],
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Complaint.insertMany(complaints);
  console.log(`✅ Inserted ${complaints.length} complaints.`);

  const counts = {
    reported: complaints.filter(c => c.status === 'reported').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    escalated: complaints.filter(c => c.escalated).length,
  };
  console.log('Status breakdown:', counts);
  console.log('\n📋 Demo login credentials:');
  console.log('  Admin  → admin@neighbourfix.com  / Demo@1234');
  console.log('  User 1 → ravi.kumar@example.com  / Demo@1234');
  console.log('  User 2 → priya.sharma@example.com / Demo@1234');

  await mongoose.disconnect();
  console.log('\nDone! ✅');
}

seed().catch(err => { console.error(err); process.exit(1); });
