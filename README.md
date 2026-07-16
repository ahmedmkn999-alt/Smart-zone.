# SMART ZONE — Next.js

نسخة Next.js كاملة من منصة SMART ZONE، ببنية أمان حقيقية على مستوى السيرفر بدل الحماية الشكلية اللي كانت في نسخة الـ HTML الأولى.

## 1) التشغيل محليًا

```bash
npm install
cp .env.example .env.local
# افتح .env.local واملأ الأسرار (تعليمات التوليد موجودة جوه الملف نفسه)

npm run db:push     # بيعمل قاعدة بيانات SQLite محلية من الـ schema
npm run db:seed      # بيعمل أول حساب أدمن (الإيميل/الباسورد من .env.local)
npm run dev
```

افتح `http://localhost:3000` للموقع، و `http://localhost:3000/admin/login` للوحة التحكم.

⚠️ **مهم**: البيئة اللي بنيت فيها المشروع مفيهاش اتصال إنترنت، فمقدرتش أعمل `npm install` ولا `npm run build` ولا أجرب المشروع فعليًا شغال. الكود كله مكتوب بعناية ومتسق، بس لازم تجرب `npm install` و `npm run dev` عندك وتتابع أي خطأ تبعيات (dependency) بسيط لو ظهر.

## 2) قبل ما تنزله على السيرفر الحقيقي (Production)

1. **قاعدة البيانات**: غيّر `provider` في `prisma/schema.prisma` من `sqlite` لـ `postgresql`، وحط `DATABASE_URL` بتاع قاعدة بيانات حقيقية (Neon, Supabase, Railway...).
2. **الأسرار**: ولّد قيم عشوائية جديدة لـ `JWT_SECRET`, `CODE_PEPPER`, `ENCRYPTION_KEY`, `CSRF_SECRET` — الأوامر موجودة في `.env.example`. متستخدمش نفس القيم من التجربة المحلية.
3. **NODE_ENV=production** و **NEXT_PUBLIC_APP_URL** بدومينك الحقيقي بـ https — من غيرهم الكوكيز الـ `Secure` مش هتشتغل.
4. **Rate limiting**: النسخة الحالية بتستخدم Map في الذاكرة (`src/lib/rateLimit.ts`) وده كفاية لسيرفر واحد. لو نشرت على Vercel أو أي منصة serverless بتشغل أكتر من instance، استبدلها بـ Upstash Redis (`@upstash/ratelimit`) — نفس الـ function signature فمفيش تعديل تاني مطلوب.

## 3) خريطة كل الحمايات اللي اتطلبت

| المطلوب | مكانه في الكود | ملاحظات |
|---|---|---|
| JWT | `src/lib/jwt.ts` | مكتبة `jose`، access token 15 دقيقة + refresh token 30 يوم |
| HttpOnly Cookies | `src/lib/cookies.ts` | كل كوكيز الجلسة (طالب وأدمن) |
| Secure Cookies | نفس الملف | `secure: true` تلقائيًا في production |
| CSRF Protection | `src/lib/csrf.ts` + `src/lib/apiHelpers.ts` | نمط Double-Submit Cookie، بيتفحص في كل POST/PATCH/DELETE |
| CSP | `src/middleware.ts` | Content-Security-Policy على كل response |
| XSS Protection | CSP + React auto-escaping + Zod | React بيهرب أي نص تلقائي، والـ CSP بتمنع سكريبتات خارجية |
| SQL Injection Protection | Prisma في كل مكان | استعلامات مُعامَلة (parameterized) دايمًا، ومفيش أي raw SQL string concatenation |
| Rate Limit | `src/lib/rateLimit.ts` | على تسجيل دخول الطالب والأدمن ورسائل الدعم |
| Input Validation / Zod | `src/lib/validators.ts` | كل API route بيعدي من schema قبل ما يلمس الداتابيز |
| Helmet / Security Headers | `src/middleware.ts` | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS |
| Password Hash | `src/lib/hash.ts` | bcrypt، 12 rounds |
| Code Hash | `src/lib/hash.ts` (`hashCode`) | HMAC-SHA256 بمفتاح سري (pepper) — راجع الشرح تحت |
| UUID | كل الجداول في `prisma/schema.prisma` | `@default(uuid())` بدل الأرقام المتسلسلة |
| Encryption | `src/lib/encryption.ts` | AES-256-GCM، جاهزة لأي حقل حساس مستقبلي |
| Audit Logs | `src/lib/audit.ts` + جدول `AuditLog` | كل عملية حساسة (دخول، إنشاء كود، حظر، رد دعم...) بتتسجل |

## 4) حماية الأكواد (نقطة 13 في طلبك)

الكود بيتخزن كـ **HMAC-SHA256 hash بس** (`Code.codeHash`)، مش نص صريح. النص الحقيقي بيترجع مرة واحدة بس لحظة الإنشاء (في رسالة الـ API) عشان تنسخه وتديه للطالب، وبعدها مستحيل تسترجعه تاني من قاعدة البيانات — لو الأدمن ضاع منه، الحل الوحيد إنشاء كود جديد.

استخدمنا **HMAC** بدل **bcrypt** للأكواد تحديدًا (رغم إن bcrypt هو المعيار لباسورد الأدمن) لسبب تقني مهم: bcrypt بيولّد salt عشوائي كل مرة، يعني نفس الكود بيدي hash مختلف كل مرة — وده يمنعنا من عمل `WHERE codeHash = ...` عشان نلاقي الكود وقت تسجيل الدخول. HMAC بمفتاح سري ثابت (`CODE_PEPPER`) بيدي نفس الـ hash لنفس الكود دايمًا، فنقدر نبحث بيه مباشرة، وفي نفس الوقت الكود الأصلي مستحيل يترجع من الـ hash من غير المفتاح السري اللي عايش في الـ server env بس.

## 5) الحماية من العبث (نقطة 14) — إزاي اتفهمت وطُبّقت

الطلب كان واضح: **فتح DevTools لوحده مش مخالفة**. المشروع مبني من الأساس بحيث معندوش أي "حالة اشتراك" أو "صلاحيات" متخزنة في مكان يقدر المتصفح يعدّل فيه ويأثر على حاجة حقيقية:

- التوكنات في كوكيز HttpOnly — الـ JavaScript مش قادر يقراها ولا يعدلها أصلاً.
- أي صفحة أو API بيتحقق من التراك/الحالة/الصلاحية **من قاعدة البيانات على السيرفر** في كل طلب (`getVerifiedStudentSession` في `src/lib/auth.ts`)، مش من أي حاجة جاية من الكلاينت.

فالعبث الحقيقي اللي السيرفر بيكتشفه ويسجله (`src/lib/security.ts`) هو:
- **طلب بجهاز تاني** لكود متقفل على جهاز واحد (`DEVICE_MISMATCH`).
- **طلب مزوّر فعليًا** — زي طالب بيحاول يفتح مادة/كورس مش تبع شعبته بتعديل الـ id يدويًا في الطلب (`FORGED_REQUEST`) — مطبق فعليًا في `src/app/api/teachers`, `courses`, `days`, `lessons`.
- **توكن CSRF غلط أو ناقص** على أي طلب بيغيّر بيانات (`CSRF_FAIL`).

كل محاولة بتتسجل في جدول `SecurityViolation` وبتزوّد `Code.violationCount`. **بعد 3 محاولات**:
- كل جلسات الكود بتتلغي فورًا (`Session.revokedAt`).
- الكود بيتحط `status = "suspended"` (مختلف عن "محظور" اليدوي، عشان الأدمن يقدر يفرق بينهم ويقرر السياسة).
- كل ده بيبان في `/admin/security` كـ"إشعار" — مفيش نظام push notifications حي (WebSocket) في النسخة دي، اللوحة بتعمل polling بسيط. لو عايز تنبيه فوري (صوت/إشعار متصفح)، ده تحسين سهل يتضاف بعدين.

الأدمن يقدر يصفّر عداد المحاولات ويرجّع الكود يشتغل من `/admin/codes` (زرار "تصفير محاولات العبث").

## 6) هيكل المحتوى (سؤالك عن المدرسين/الكورسات/الأيام/الفيديوهات)

Track ← مادة (Subject) ← مدرس (Teacher) ← كورس/شهر (Course) ← يوم (CourseDay) ← حصة/فيديو (Lesson)

كل مستوى له صفحة إدارة منفصلة في اللوحة (زي ما طلبت بالظبط):
- `/admin/content/subjects`
- `/admin/content/subjects/[id]/teachers`
- `/admin/content/teachers/[id]/courses`
- `/admin/content/courses/[id]/days`
- `/admin/content/days/[id]/lessons`

وصور المدرسين/المواد بتتحط كرابط (`imageUrl` / `photoUrl`) من نفس صفحة الإدارة — مفيش رفع ملفات في النسخة دي، بس سهل تضاف بعدين (Uploadthing / S3 / Cloudinary).

## 7) الإضافات اللي طلبتها بعد كده (نقاط 15-20)

### منع استنساخ الموقع (15)
- `frame-ancestors 'none'` + `X-Frame-Options: DENY` في `src/middleware.ts` و`vercel.json` — الموقع مينفعش يتفتح جوه `<iframe>` في أي دومين تاني خالص.
- **Host header validation**: أي طلب بـ `Host` مختلف عن `NEXT_PUBLIC_APP_URL` بيترفض بـ 421 — بيوقف أي reverse proxy بيحاول يعرض موقعك على دومين غريب.
- **Strict CORS**: أي طلب POST/PATCH/DELETE جاي من `Origin` مختلف عن دومينك بيترفض بـ 403.

### بصمة الجهاز الحقيقية (16)
غيّرنا القفل من UUID متخزن في localStorage (سهل المسح/التزوير) لبصمة حقيقية بتتحسب من جديد كل مرة من خصائص الجهاز نفسه (`src/lib/deviceFingerprint.ts`): user agent, الشاشة, المنطقة الزمنية, canvas fingerprint, WebGL renderer. السيرفر بيعمل HMAC-hash للبصمة (`hashDeviceFingerprint` في `src/lib/hash.ts`) قبل ما يقارنها أو يخزنها — نفس فكرة الأكواد بالظبط، مفيش نص خام متخزن.

⚠️ صراحة: مفيش بصمة متصفح (browser fingerprint) مضمونة 100%، ده معروف صناعيًا. الجمع بين إشارات متعددة (مش واحدة بس) بيقلل الاحتمالية جدًا، بس الحل المضمون فعلاً غالبًا هو ربط الكود كمان بجلسة نشطة واحدة بس (اللي إحنا عاملينه أصلاً عن طريق `Session` + الـ refresh token)، مش الاعتماد على البصمة لوحدها.

### حماية الفيديوهات (17)
- **علامة مائية متحركة**: `src/components/VideoWatermark.tsx` بيظهر اسم الطالب + آخر 4 أرقام من كوده فوق الفيديو، بيتحرك مكانه كل 4 ثواني.
- **روابط مؤقتة موقّعة**: `src/lib/videoAccess.ts` — أي وصول لرابط الفيديو بيعدي أول على `/api/video/[lessonId]/access` اللي بيتحقق من التراك والجلسة ويولّد توكن صالح لساعتين بس.
- ⚠️ صراحة تانية: ده حماية على مستوى تطبيقنا احنا (منع الوصول، تتبّع مين اتفرج). مش تشفير بيتات الفيديو فعليًا ولا تقسيم HLS حقيقي — لو عايز الدرجة دي، لازم تستضيف الفيديوهات على سيرفر متخصص زي Mux أو Cloudflare Stream أو bunny.net Stream، وده قرار استضافة منفصل مش حاجة أقدر أبنيها بكود تطبيق بس.

### أمن لوحة التحكم (18)
- **RBAC**: كل الـ API الخاصة بالأدمن بتعدي من `requireAdmin()` (`src/lib/apiHelpers.ts`) اللي بيتأكد إن الدور `admin`/`superadmin` قبل أي حاجة.
- **IP Allowlist اختياري**: لو حطيت `ADMIN_IP_ALLOWLIST` في `.env`، أي حد يفتح `/admin/*` من IP مش في القائمة بياخد 403 — سيبها فاضية لو الأدمن بيشتغل من IP متغيّر.
- **2FA حقيقي (TOTP)**: `src/lib/twofa.ts` + `/admin/2fa` (صفحة التفعيل) + `/api/admin/login/totp`. بعد ما تفعّله، أي دخول للوحة بيحتاج كود من Google Authenticator/Authy كمان، مش الباسورد بس. سر الـ TOTP نفسه متخزن مشفّر (AES-256-GCM) مش نص صريح.

### سرية متغيرات البيئة (19)
كل الأسرار الحساسة (`JWT_SECRET`, `CODE_PEPPER`, `DEVICE_PEPPER`, `ENCRYPTION_KEY`, `CSRF_SECRET`, `DATABASE_URL`) **من غير** بادئة `NEXT_PUBLIC_` عمدًا — أي متغيّر ببادئة `NEXT_PUBLIC_` في Next.js بيتحط في كود الجافاسكريبت اللي بينزل للمتصفح، فلازم تفضل بعيدة عنها خالص. البادئة دي مستخدمة بس لـ `NEXT_PUBLIC_APP_URL` اللي مفيهاش أي سرية أصلًا.

### vercel.json (20)
اتحط في جذر المشروع (`vercel.json`) — رؤوس أمان إضافية على مستوى الاستضافة نفسها، طبقة تانية فوق اللي بيعمله `middleware.ts` (مش بديل عنه).

## 8) حدود معروفة (مش هخبيها عنك)

- **Rate limiting في الذاكرة**: مش هيشتغل صح لو نشرت على أكتر من سيرفر/instance في نفس الوقت. الحل مكتوب فوق.
- **Realtime**: لوحة الدعم الفني بتعمل تحديث كل 8 ثواني (polling)، مش WebSocket حي.
- **رفع الصور**: دلوقتي روابط بس، مفيش رفع ملفات مباشر من اللوحة.
- **الاختبار**: المشروع مكتوب بعناية لكن **متجربّش فعليًا** (`npm install` / `npm run dev` / build) لأن بيئة الكتابة مفيهاش إنترنت. جرّبه محليًا الأول قبل أي نشر حقيقي.
