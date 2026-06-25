import type { Metadata } from 'next';
import { Mail, ShieldCheck, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '계정 및 데이터 삭제 요청 | 언제볼래',
  description: '언제볼래 계정 및 관련 데이터 삭제 요청 방법을 안내합니다.',
};

const EFFECTIVE_DATE = '2026.06.25';
const ACCOUNT_DELETION_EMAIL =
  process.env.NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL?.trim() ||
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() ||
  'privacy@whenbollae.app';
const MAIL_SUBJECT = '[언제볼래 계정 삭제 요청]';
const MAIL_BODY = [
  '언제볼래 계정 및 관련 데이터 삭제를 요청합니다.',
  '',
  '1. 로그인 방법: Google 또는 Kakao',
  '2. 계정 이메일:',
  '3. 앱에 표시되는 이름 또는 프로필 아이디:',
  '4. 삭제 범위: 계정과 관련 데이터 전체 삭제',
  '',
  '본인 확인에 필요한 추가 안내를 회신해 주세요.',
].join('\n');

const requestSteps = [
  '아래 이메일 버튼을 눌러 계정 삭제 요청 메일을 작성합니다.',
  '메일에 로그인 방법, 계정 이메일, 앱에 표시되는 이름 또는 프로필 아이디를 적어 보냅니다.',
  '언제볼래가 본인 확인을 위해 필요한 경우 추가 정보를 요청할 수 있습니다.',
  '본인 확인이 끝나면 계정 및 관련 서버 데이터를 삭제하고 처리 결과를 회신합니다.',
];

const deletedData = [
  'Supabase Auth 계정과 인증 세션',
  '프로필 아이디, 표시 이름, 프로필 이미지 URL, 시간대',
  '친구 요청, 친구 관계, 카드 초대 대상 정보',
  '사용자가 만든 약속 카드, 후보 시간, 장소, 메시지, 공유 토큰',
  '약속 카드 응답자 정보, 응답 선택값, 한마디',
  '계정에 저장된 일정, 할 일, 완료 상태, 색상값',
  'Expo 푸시 토큰, 기기 라벨, 알림 설정 등 계정에 연결된 알림 정보',
];

const retainedData = [
  {
    title: '삭제 요청 메일 및 처리 기록',
    body: '요청 처리 확인, 분쟁 대응, 법령상 의무 이행을 위해 최대 3년 동안 보관할 수 있습니다.',
  },
  {
    title: '보안, 오류, 남용 방지 기록',
    body: '서비스 보호와 부정 이용 방지를 위해 계정 식별이 최소화된 서버 로그 또는 응답 제한 해시가 최대 90일 동안 보관될 수 있습니다.',
  },
  {
    title: '법령상 보관이 필요한 자료',
    body: '관련 법령, 수사기관 요청, 분쟁 대응 등 정당한 사유가 있는 경우 해당 사유가 끝날 때까지 필요한 범위에서 보관할 수 있습니다.',
  },
  {
    title: '기기 안의 로컬 캐시',
    body: '계정 삭제 후에도 사용자의 기기에 남아 있는 앱 캐시는 앱 삭제 또는 기기 설정의 앱 데이터 삭제를 통해 제거할 수 있습니다.',
  },
];

const beforeRequest = [
  '계정 삭제는 로그아웃이나 앱 삭제와 다르며, 서버에 저장된 계정과 관련 데이터를 삭제하는 절차입니다.',
  '계정 삭제가 완료되면 친구 관계, 카드, 응답, 일정, 할 일 데이터는 복구하기 어렵습니다.',
  '공유 링크를 받은 비회원 응답 데이터는 카드 생성자 계정과 연결된 카드 데이터로 함께 삭제됩니다.',
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t-2 border-[var(--app-line)] py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[22px] font-black leading-tight text-[var(--app-ink)]">{title}</h2>
      <div className="mt-4 text-[15px] font-bold leading-7 text-[var(--app-ink-muted)]">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-primary-deep)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AccountDeletionPage() {
  const mailHref = `mailto:${ACCOUNT_DELETION_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

  return (
    <main className="min-h-dvh bg-[var(--app-background)] px-5 py-8 text-[var(--app-ink)] sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-[860px]">
        <header className="pb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border-2 border-[var(--app-line)] bg-[var(--app-danger-soft)]">
            <Trash2 aria-hidden="true" className="h-7 w-7 text-[var(--app-danger)]" />
          </div>
          <p className="mt-5 text-sm font-black text-[var(--app-primary-deep)]">언제볼래</p>
          <h1 className="mt-2 text-[34px] font-black leading-tight text-[var(--app-ink)] sm:text-[42px]">
            계정 및 데이터 삭제 요청
          </h1>
          <p className="mt-4 max-w-[720px] text-base font-bold leading-7 text-[var(--app-ink-muted)]">
            이 페이지는 Google Play 스토어에 등록된 앱 언제볼래의 계정과 관련 데이터 삭제 요청을 시작하기 위한
            공식 웹페이지입니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-black text-[var(--app-ink)]">
            <span className="rounded-full border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1">
              앱 이름 언제볼래
            </span>
            <span className="rounded-full border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1">
              최종 수정일 {EFFECTIVE_DATE}
            </span>
          </div>
        </header>

        <div className="app-card-shadow rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-5 py-6 sm:px-8 sm:py-8">
          <section className="rounded-[18px] border-2 border-[var(--app-line)] bg-[var(--app-coral-soft)] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--app-primary-deep)]" />
              <div>
                <h2 className="text-xl font-black leading-tight text-[var(--app-ink)]">삭제 요청을 시작하는 방법</h2>
                <p className="mt-2 text-sm font-extrabold leading-6 text-[var(--app-ink)]">
                  계정 삭제를 요청하려면 아래 버튼으로 이메일을 보내 주세요. 앱을 다시 설치하거나 로그인하지
                  않아도 요청할 수 있습니다.
                </p>
                <a
                  href={mailHref}
                  className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-4 text-sm font-black text-[var(--app-ink)] transition active:scale-[0.99]">
                  <Mail aria-hidden="true" className="h-4 w-4 text-[var(--app-primary-deep)]" />
                  {ACCOUNT_DELETION_EMAIL}
                </a>
              </div>
            </div>
          </section>

          <Section title="1. 요청 절차">
            <ol className="grid gap-3">
              {requestSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--app-line)] bg-[var(--app-lime-soft)] text-sm font-black text-[var(--app-primary-deep)]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-4">
              본인 확인이 완료된 삭제 요청은 원칙적으로 30일 이내 처리합니다. 요청 내용이 불분명하거나 본인 확인이
              필요한 경우 처리 기간은 추가 확인이 완료된 날부터 계산될 수 있습니다.
            </p>
          </Section>

          <Section title="2. 요청 전에 확인할 내용">
            <BulletList items={beforeRequest} />
          </Section>

          <Section title="3. 삭제되는 데이터">
            <p className="mb-4">
              계정 삭제가 승인되면 언제볼래 서버에서 아래 계정 관련 데이터를 삭제합니다.
            </p>
            <BulletList items={deletedData} />
          </Section>

          <Section title="4. 보관될 수 있는 데이터와 기간">
            <div className="grid gap-4">
              {retainedData.map((item) => (
                <div key={item.title} className="rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-4">
                  <h3 className="text-base font-black text-[var(--app-ink)]">{item.title}</h3>
                  <p className="mt-1">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="5. 문의">
            <p>
              계정 삭제, 관련 데이터 삭제, 개인정보 처리에 관한 문의는 같은 이메일로 접수할 수 있습니다. 삭제
              요청을 취소하려면 처리 완료 안내를 받기 전에 동일한 이메일 주소로 취소 의사를 보내 주세요.
            </p>
            <a
              href={mailHref}
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-coral-soft)] px-4 text-sm font-black text-[var(--app-ink)] transition active:scale-[0.99]">
              <Mail aria-hidden="true" className="h-4 w-4 text-[var(--app-primary-deep)]" />
              계정 삭제 요청 메일 보내기
            </a>
          </Section>
        </div>
      </article>
    </main>
  );
}
