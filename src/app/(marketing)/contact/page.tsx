import type { Metadata } from 'next';
import ReportIssueForm from '@/components/marketing/ReportIssueForm';

export const metadata: Metadata = {
  title: 'კონტაქტი · Engli',
  description: 'მოგვწერეთ შეცდომის შესახებ ან დასვით კითხვა.'
};

const SUPPORT_EMAIL = 'support@engli.app';

export default function ContactPage() {
  return (
    <article>
      <h1>დაგვიკავშირდი</h1>
      <p>
        ნებისმიერი კითხვა, შემოთავაზება ან საჩივარი — მოგვწერეთ{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. ვცდილობთ
        პასუხი გავცეთ 1–2 სამუშაო დღეში.
      </p>

      <h2>ჩვენი მისამართი</h2>
      <p className="text-sm text-ink-light">
        Your Next Tutor Inc.
        <br />
        თბილისი, საქართველო
      </p>

      <h2>გავიდე პრობლემაში</h2>
      <p>
        თუ შეცდომას ან ცუდად მუშაობს გვერდი, შეგიძლია მოკლედ აღწერო
        ქვემოთ — ჩვენი გუნდი მიიღებს შენს შეტყობინებას.
      </p>

      <ReportIssueForm />

      <div className="note mt-6">
        <strong>გადაუდებელი:</strong> Engli არ არის საგანგებო სამსახური.
        თუ ბავშვს ან თქვენთან მყოფ პირს ემუქრება საფრთხე, დაუყოვნებლივ
        დარეკეთ 112-ში.
      </div>
    </article>
  );
}
