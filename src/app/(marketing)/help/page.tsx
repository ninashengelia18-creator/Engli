import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'დახმარება · Engli',
  description: 'ხშირად დასმული შეკითხვები და დახმარების ცენტრი.'
};

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'როგორ დავიწყო?',
    a: (
      <>
        გახსენი ანგარიში, აარჩიე ბავშვის ასაკი და მიზანი, შემდეგ დაიწყე
        პირველი გაკვეთილი „Beginner“ სამყაროდან.
      </>
    )
  },
  {
    q: 'რას ნიშნავს გულები?',
    a: (
      <>
        ყოველი არასწორი პასუხი ხარჯავს ერთ გულს. გულები ავტომატურად ივსება
        გარკვეული დროის შემდეგ — ან Premium-ში არ ხდება შემცირება.
      </>
    )
  },
  {
    q: 'Premium რა მომცემს?',
    a: (
      <>
        ულიმიტო გულები, AI მასწავლებელი, დახურული გაკვეთილები და მშობლის
        პროგრესის პანელი. 7 დღე უფასოდ.{' '}
        <Link href="/upgrade">გადახედე გეგმებს</Link>.
      </>
    )
  },
  {
    q: 'როგორ გავაუქმო გამოწერა?',
    a: (
      <>
        პროფილი → მართე გამოწერა → Stripe Billing პორტალი. გაუქმების
        შემდეგ Premium რჩება მიმდინარე პერიოდის ბოლომდე.
      </>
    )
  },
  {
    q: 'როგორ ვარჯიში გამოთქმა მუშაობს?',
    a: (
      <>
        ვიყენებთ ბრაუზერის ხმის ამოცნობას. ჩვენ ხმოვან ჩანაწერს არ ვინახავთ.
        ხანდახან მიკროფონის ნებართვა საჭიროა.
      </>
    )
  },
  {
    q: 'შევხვდი შეცდომას ან საეჭვო კონტენტს, რა ვქნა?',
    a: (
      <>
        გვაცნობე — <Link href="/contact">საკონტაქტო გვერდი</Link>. ცდილობთ
        გასცეთ პასუხი 1–2 სამუშაო დღეში.
      </>
    )
  }
];

export default function HelpPage() {
  return (
    <article>
      <h1>დახმარების ცენტრი</h1>
      <p>
        ვერ მოძებნე პასუხი? იხ. <Link href="/contact">საკონტაქტო გვერდი</Link> ან{' '}
        <Link href="/parent-guide">მშობლის გზამკვლევი</Link>.
      </p>

      <h2>ხშირად დასმული შეკითხვები</h2>
      {FAQS.map((item, i) => (
        <details key={i} className="border border-border rounded-xl p-4 mb-2 bg-white">
          <summary className="font-bold cursor-pointer text-ink">{item.q}</summary>
          <div className="text-sm text-ink-light mt-2">{item.a}</div>
        </details>
      ))}
    </article>
  );
}
