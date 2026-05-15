import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-10 pb-8 text-center">
        <div className="text-7xl mb-3 animate-bounce" aria-hidden="true">🦊</div>
        <h1 className="text-4xl font-extrabold text-primary mb-1 tracking-tight">ენგლი</h1>
        <p className="text-sm font-semibold text-ink-light mb-4">Engli</p>
        <p className="text-base text-ink mb-1 max-w-xs leading-snug font-semibold">
          ისწავლე ინგლისური სახალისოდ
        </p>
        <p className="text-sm text-ink-light mb-6 max-w-xs leading-relaxed">
          ქართველი ბავშვებისთვის — თამაშის სახით, ხმოვანი ვარჯიშითა და AI მასწავლებლით.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/sign-up" className="btn-primary text-center" data-testid="cta-signup">
            დაიწყე უფასოდ
          </Link>
          <Link href="/demo" className="btn-secondary text-center" data-testid="cta-demo">
            სცადე გაკვეთილი (1 წუთი)
          </Link>
        </div>

        <p className="mt-3 text-xs text-ink-lighter">7 დღე უფასოდ · შემდეგ ₾1/თვე</p>
      </section>

      {/* Why Engli — value props */}
      <section className="px-5 pb-2" aria-labelledby="why-engli">
        <h2 id="why-engli" className="font-extrabold text-center text-base mb-3">
          რატომ Engli?
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <ValueCard
            emoji="🇬🇪"
            title="ქართულზე აგებული"
            body="ყველა ინსტრუქცია ქართულად. ბავშვი არ ბრკოლდება უცნობ ინტერფეისზე."
          />
          <ValueCard
            emoji="🎮"
            title="თამაშის სახით"
            body="გული, XP, ბრილიანტი და სტრიკი — ბავშვი ყოველდღე ბრუნდება."
          />
          <ValueCard
            emoji="🎤"
            title="ხმოვანი ვარჯიში"
            body="წარმოთქმის ვარჯიში მიკროფონით — სწორი ინგლისური ჟღერადობა."
          />
          <ValueCard
            emoji="🤖"
            title="AI მასწავლებელი"
            body="პატარა, უსაფრთხო AI თანამოსაუბრე, რომელიც პასუხობს ქართულზე და ინგლისურზე."
          />
        </div>
      </section>

      {/* What's inside */}
      <section className="px-5 py-6" aria-labelledby="whats-inside">
        <h2 id="whats-inside" className="font-extrabold text-center text-base mb-3">
          რა შედის შიგნით
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <FeatureTile emoji="📚" label="100+ გაკვეთილი" />
          <FeatureTile emoji="🎯" label="6 ვარჯიშის ტიპი" />
          <FeatureTile emoji="🏆" label="მიღწევები" />
          <FeatureTile emoji="📈" label="მშობლის პანელი" />
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 pb-2" aria-labelledby="pricing">
        <h2 id="pricing" className="font-extrabold text-center text-base mb-3">
          ფასი
        </h2>
        <div className="card p-5 bg-gradient-to-b from-white to-bg-soft text-center">
          <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1">
            დამწყები ფასი
          </div>
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className="text-4xl font-extrabold text-primary">₾1</span>
            <span className="text-sm text-ink-light">/თვე</span>
          </div>
          <p className="text-xs text-ink-light mb-4">7 დღე უფასოდ · ნებისმიერ დროს გააუქმე</p>
          <ul className="text-sm text-ink space-y-1.5 mb-5 text-left max-w-xs mx-auto">
            <li>✅ ყველა გაკვეთილი და სამყარო</li>
            <li>✅ შეუზღუდავი AI მასწავლებელი</li>
            <li>✅ ხმოვანი ვარჯიში</li>
            <li>✅ მიღწევები და სტრიკი</li>
            <li>✅ მშობლის პანელი</li>
          </ul>
          <Link href="/sign-up" className="btn-primary w-full inline-block text-center">
            დაიწყე 7-დღიანი უფასო ცდა
          </Link>
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-5 py-6" aria-labelledby="safety">
        <h2 id="safety" className="font-extrabold text-center text-base mb-3">
          მშობლისთვის უსაფრთხო
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <TrustBadge emoji="🛡️" label="რეკლამის გარეშე" />
          <TrustBadge emoji="🔒" label="უსაფრთხო AI" />
          <TrustBadge emoji="👨‍👩‍👧" label="მშობლის კონტროლი" />
        </div>
        <div className="mt-3 text-center">
          <Link href="/safety" className="text-xs text-secondary underline">
            ვრცლად უსაფრთხოების შესახებ →
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-8 text-center">
        <div className="card p-5 bg-primary/5 border-primary/20">
          <div className="text-3xl mb-2" aria-hidden="true">🚀</div>
          <p className="font-extrabold text-base mb-1">მზად ხარ?</p>
          <p className="text-xs text-ink-light mb-4">
            ერთი წუთი დასჭირდება დარეგისტრირებას — 7 დღე უფასოდ.
          </p>
          <Link href="/sign-up" className="btn-primary w-full inline-block text-center">
            დაიწყე უფასოდ
          </Link>
          <Link
            href="/sign-in"
            className="block mt-3 text-xs text-secondary underline"
          >
            უკვე გაქვს ანგარიში? შესვლა
          </Link>
        </div>
      </section>

      <nav
        aria-label="საინფორმაციო გვერდები"
        className="px-5 pb-6 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-ink-light"
      >
        <Link href="/parent-guide" className="underline">მშობელს</Link>
        <Link href="/safety" className="underline">უსაფრთხოება</Link>
        <Link href="/about-ai" className="underline">AI-ის შესახებ</Link>
        <Link href="/help" className="underline">დახმარება</Link>
        <Link href="/privacy" className="underline">კონფიდენციალურობა</Link>
        <Link href="/terms" className="underline">პირობები</Link>
      </nav>

      <div className="pb-8 text-center text-xs text-ink-lighter">Made with 💚 in Georgia</div>
    </main>
  );
}

function ValueCard({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="card p-4 flex gap-3 items-start">
      <div className="text-3xl shrink-0" aria-hidden="true">{emoji}</div>
      <div className="text-left">
        <div className="font-extrabold text-sm text-ink mb-0.5">{title}</div>
        <div className="text-xs text-ink-light leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function FeatureTile({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="card p-3">
      <div className="text-2xl mb-1" aria-hidden="true">{emoji}</div>
      <div className="text-xs font-semibold text-ink">{label}</div>
    </div>
  );
}

function TrustBadge({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="card p-3 bg-bg-soft">
      <div className="text-2xl mb-1" aria-hidden="true">{emoji}</div>
      <div className="text-[10px] leading-tight text-ink-light">{label}</div>
    </div>
  );
}
