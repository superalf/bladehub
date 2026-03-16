/**
 * Seed script — populates Firebase emulator with demo data.
 * Run AFTER starting emulators: npm run seed
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const app = initializeApp({
  apiKey: "demo-key",
  authDomain: "bladehub-local.firebaseapp.com",
  projectId: "demo-bladehub",
  storageBucket: "demo-bladehub.appspot.com",
  messagingSenderId: "000000",
  appId: "1:000000:web:000000",
});

const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, "localhost", 8080);
connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

const past = (daysAgo: number) =>
  Timestamp.fromDate(new Date(Date.now() - daysAgo * 86400_000));

async function seed() {
  console.log("🌱 Seeding BladeHub emulator...");

  // Create demo users
  const users = [
    { email: "kesesgabor@demo.hu", password: "demo123456", displayName: "KésesGábor", karma: 142, bio: "15 éve gyűjtök spyderco és benchmade késeket." },
    { email: "fejszepeter@demo.hu", password: "demo123456", displayName: "FejszePéter", karma: 89, bio: "Gransfors Bruks rajongó, erdész." },
    { email: "multitoolmark@demo.hu", password: "demo123456", displayName: "MultitoolMárk", karma: 67, bio: "Leatherman és Victorinox gyűjtő." },
  ];

  const createdUsers: { uid: string; displayName: string }[] = [];

  for (const u of users) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      await updateProfile(cred.user, { displayName: u.displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: u.displayName,
        email: u.email,
        karma: u.karma,
        bio: u.bio,
        joinedAt: past(180),
        listingCount: 0,
        postCount: 0,
      });
      createdUsers.push({ uid: cred.user.uid, displayName: u.displayName });
      console.log(`  ✓ User: ${u.displayName}`);
    } catch {
      console.log(`  ⚠️  User ${u.email} may already exist, skipping`);
    }
  }

  if (createdUsers.length === 0) {
    console.log("No new users created, skipping thread/listing seed.");
    return;
  }

  const [gabor, peter, mark] = createdUsers;

  // Forum threads
  const threadData = [
    {
      title: "Spyderco Paramilitary 2 vs Benchmade Bugout — összehasonlítás",
      categoryId: "zsebkesek",
      categoryName: "Zsebkések",
      author: gabor,
      tags: ["spyderco", "benchmade", "s30v", "m390"],
      body: `Régóta tesztelgetem ezt a két kést munkára és hordásra, és most leírom a tapasztalataimat.\n\n**Paramilitary 2 (S30V acél)**\nKiváló él-tartás, kicsit nehezebb élesíteni otthon. A compression lock megbízható, soha nem volt gondja. 86g súly, kicsit nehezebb zsebkésnek, de a markolat kivételesen kényelmes.\n\n**Bugout (M390 acél)**\nFelszabadítóan könnyű (57g!), a tengelykapocs kiváló, nem forgolódik a zsebben. Az M390 élezési szög érzékenyebb, de a végeredmény élesebb él.\n\nMindkettőt tudom ajánlani — a PM2 inkább munkakés, a Bugout inkább EDC hordásra.`,
      daysAgo: 5,
    },
    {
      title: "Gransfors Bruks Small Forest Axe — 3 hónapos teszt",
      categoryId: "fejszek-baltak",
      categoryName: "Fejszék & Balták",
      author: peter,
      tags: ["gransfors", "swedesaxe", "bushcraft"],
      body: `Három hónapja használom a Gransfors Bruks Small Forest Axe-t aktívan — fatáborozás, hasítás, ágvágás. Rövid összefoglaló:\n\nA fej minősége kivételes, élesítés után borotvaéles. A hickory nyél kicsit megmozdult a száraz időben, de egy éjszaka vízben állás megoldotta. 600g-os súlya tökéletes egykezes használatra.\n\nEgyetlen hiányosság: a bőrtok sokáig kemény volt. Lenvajjal kellett bekeni néhányszor.`,
      daysAgo: 12,
    },
    {
      title: "Leatherman Wave+ vs Victorinox SwissChamp — melyiket válasszam?",
      categoryId: "multitoolok",
      categoryName: "Multitoolok",
      author: mark,
      tags: ["leatherman", "victorinox", "edc", "multitool"],
      body: `Ez a kérdés sokszor felmerül beginnereknek, próbálom tisztázni.\n\nHa elsősorban fogóra és csavarhúzókra van szükséged: Leatherman Wave+. A fogó sokkal erőteljesebb, a bitek cserélhetők.\n\nHa inkább zsebkésnek és apró eszköznek: SwissChamp. Könnyebb, karcolásállóbb, a kicsi vértelenítő ékkel ki tudod venni a szálkát. Az olló is jobb.\n\nNekem mindkettő van — a Wave+ a szerszámosládában, a SwissChamp a zsebemben.`,
      daysAgo: 8,
    },
    {
      title: "Fenőkő kezdőknek — Diamond, japán vízkő vagy arkansasi?",
      categoryId: "koszorules-karbantartas",
      categoryName: "Köszörülés & Karbantartás",
      author: gabor,
      tags: ["feno", "elesites", "kozo", "kezdo"],
      body: `Rengetegen kérdezik, mivel kezdjék az élezést. Az én javaslatom:\n\n**Kezdőknek:** Lansky vagy Spyderco Sharpmaker rendszer. Nem kell kézi szögtartás, az eredmény kiszámítható.\n\n**Következő lépés:** 1000/3000 grit japán vízkő (pl. King). Tanulás kell hozzá, de olcsó és hatékony.\n\n**Haladóknak:** Arkansas kő + szőrszíj. Legjobb fényezési eredmény, de türelem kell hozzá.\n\nTovábbi kérdéseket szívesen válaszolok!`,
      daysAgo: 3,
    },
    {
      title: "Magyar jog: mit szabad hordani, mit nem?",
      categoryId: "jogi-kerdesek",
      categoryName: "Jogi kérdések",
      author: peter,
      tags: ["jog", "magyarorszag", "hordas", "legalis"],
      body: `Fontos téma, sokan bizonytalanok. Íme a lényeg (nem jogi tanácsadás, saját kutatás alapján):\n\n**Általában szabad:**\n- Zsebkés, ha a pengéje nem nyitható egykezesen AUTOMATIKUSAN (rugós, gravity, stb.)\n- Svájci kés (Victorinox, Wenger)\n- Fix pengéjű vadászkés vadászjeggyel\n- Fejsze, balta (eszköz, nem fegyver)\n\n**Tilos:**\n- Szúrólap (butterfly kés)\n- Rugós / automatikus zsebkés (kivéve mentők, katona)\n- Rejtett hordás "indokolatlan" esetben\n\nRészletes forrás: Btk. 325. § és a fegyverekről szóló 253/2004 Korm. rendelet.`,
      daysAgo: 20,
    },
  ];

  for (const t of threadData) {
    const now = past(t.daysAgo);
    const threadRef = await addDoc(collection(db, "threads"), {
      title: t.title,
      categoryId: t.categoryId,
      categoryName: t.categoryName,
      authorUid: t.author.uid,
      authorName: t.author.displayName,
      createdAt: now,
      lastReplyAt: past(t.daysAgo - 1),
      viewCount: Math.floor(Math.random() * 300) + 20,
      replyCount: 1,
      tags: t.tags,
      isPinned: false,
      isLocked: false,
    });

    await addDoc(collection(db, "threads", threadRef.id, "posts"), {
      threadId: threadRef.id,
      authorUid: t.author.uid,
      authorName: t.author.displayName,
      body: t.body,
      images: [],
      createdAt: now,
      likes: [],
      isFirstPost: true,
    });

    console.log(`  ✓ Thread: ${t.title.slice(0, 50)}...`);
  }

  // Listings
  const listingData = [
    {
      type: "sell",
      title: "Spyderco Paramilitary 2 S30V — kiváló állapot",
      description: "Alig használt Paramilitary 2, S30V acél, kék G10 markolat. Éles, nincs karcogás a pengén. Eredeti dobozával. 2 éve vettem új állapotban Knivesandtools-on.",
      price: 42000,
      condition: "like_new",
      category: "Zsebkés",
      location: "Budapest",
      author: gabor,
      daysAgo: 3,
    },
    {
      type: "sell",
      title: "Leatherman Wave+ teljes készlettel",
      description: "Leatherman Wave+ tokkal, bitkészlettel, extra csavarhúzóval. Minden eszköz működik, fogó erős. Kisebb karcolások a tokozaton, de a szerszám tökéletes.",
      price: 28000,
      condition: "good",
      category: "Multitool",
      location: "Pécs",
      author: mark,
      daysAgo: 5,
    },
    {
      type: "sell",
      title: "Gransfors Bruks Wildlife Hatchet — eredeti tokkal",
      description: "Svéd kézzel kovácsolt balta, 380g, eredeti bőrtokkal. Ritka darab, kis készlet. Pengéje éles, nyél tökéletes állapotban.",
      price: 55000,
      condition: "good",
      category: "Fejsze / Balta",
      location: "Miskolc",
      author: peter,
      daysAgo: 1,
    },
    {
      type: "swap",
      title: "Benchmade Bugout cseréje Paramilitary 2-re",
      description: "Benchmade Bugout M390 acél, szürke aluminium markolat, tengelykapocs. Kitűnő állapot. Csere Paramilitary 2-re (S30V vagy CPM-S110V), esetleg fizetek rá.",
      price: undefined,
      condition: "like_new",
      category: "Zsebkés",
      location: "Győr",
      author: gabor,
      daysAgo: 7,
    },
    {
      type: "wanted",
      title: "Victorinox SwissChamp keresett — bármilyen állapot",
      description: "Régi vagy újabb SwissChamp-ot keresek, a piros cellidore markolatos változatot. Akár hiányos eszközökkel is érdekel. Írjatok árat!",
      price: undefined,
      condition: "fair",
      category: "Multitool",
      location: "Debrecen",
      author: mark,
      daysAgo: 2,
    },
    {
      type: "sell",
      title: "Cold Steel Recon 1 — S35VN acél",
      description: "Cold Steel Recon 1 Clip Point, S35VN acél, G10 markolat. Kemény munkakés, soha nem hagyta cserben. Kis kopásnyomok a markolaton, penge tükörfényes.",
      price: 35000,
      condition: "good",
      category: "Zsebkés",
      location: "Eger",
      author: peter,
      daysAgo: 10,
    },
    {
      type: "sell",
      title: "Fenőkő szett: King 1000/6000 + Nagura kő",
      description: "King kétsíkú vízkő, 1000 és 6000 grit kombinált. Mellé jár egy Nagura kő a felület lazításához. Minimálisan használt, sík felület megőrizve.",
      price: 12000,
      condition: "like_new",
      category: "Fenőkő / Élező",
      location: "Budapest",
      author: gabor,
      daysAgo: 4,
    },
    {
      type: "sell",
      title: "Mora Companion MG stainless — túrára tökéletes",
      description: "Mora Companion, rozsdamentes acél, narancssárga gumi markolat. Fix penge, 104mm. Eredeti tokjával. Alig használt, egy hegyi túra volt rajta.",
      price: 5500,
      condition: "like_new",
      category: "Fix pengéjű kés",
      location: "Veszprém",
      author: peter,
      daysAgo: 6,
    },
  ];

  for (const l of listingData) {
    await addDoc(collection(db, "listings"), {
      type: l.type,
      title: l.title,
      description: l.description,
      price: l.price ?? null,
      condition: l.condition,
      category: l.category,
      location: l.location,
      images: [],
      authorUid: l.author.uid,
      authorName: l.author.displayName,
      status: "active",
      createdAt: past(l.daysAgo),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 25 * 86400_000)),
      viewCount: Math.floor(Math.random() * 80) + 5,
    });
    console.log(`  ✓ Listing: ${l.title.slice(0, 50)}...`);
  }

  console.log("\n✅ Seed complete! Open http://localhost:3000");
  console.log("   Demo login: kesesgabor@demo.hu / demo123456");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
