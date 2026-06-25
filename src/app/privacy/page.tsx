import type { Metadata } from 'next';
import { Mail, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 언제볼래',
  description: '언제볼래 서비스의 개인정보 처리 기준을 안내합니다.',
};

const EFFECTIVE_DATE = '2026.06.25';
const PRIVACY_CONTACT_EMAIL = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() || 'privacy@whenbollae.app';

const collectedDataGroups = [
  {
    title: '회원가입 및 로그인',
    items: [
      'Supabase Auth 사용자 식별자',
      '소셜 로그인 제공자가 전달하는 이메일, 이름, 프로필 이미지 등 사용자가 동의한 정보',
      '로그인 제공자, 인증 세션 정보',
    ],
  },
  {
    title: '프로필 및 친구 기능',
    items: [
      '프로필 아이디, 표시 이름, 프로필 이미지 URL, 시간대',
      '친구 요청을 보내고 받은 사용자 정보, 요청 상태, 요청 메시지',
      '친구 관계 정보',
    ],
  },
  {
    title: '약속 카드, 일정, 할 일',
    items: [
      '약속 카드 제목, 장소, 메시지, 후보 시간, 카드 상태, 공유 토큰',
      '초대 대상, 응답자 닉네임, 한마디, 응답 선택값',
      '일정 제목, 장소, 시작 및 종료 시간, 할 일 제목과 상세, 완료 여부, 색상값',
    ],
  },
  {
    title: '공개 응답 웹',
    items: [
      '초대받은 사용자가 입력한 닉네임, 한마디, 가능 여부 또는 후보 시간 투표값',
      '같은 브라우저의 중복 응답을 확인하기 위한 응답 쿠키',
      '공개 응답 남용 방지를 위한 IP 주소 기반 해시값과 요청 횟수',
    ],
  },
  {
    title: '알림, 광고, 서비스 진단',
    items: [
      '알림 권한 상태, 알림 카테고리 설정, 리마인드 설정',
      'Expo 푸시 토큰, 기기 라벨, 알림 발송 상태',
      'Firebase Analytics, Remote Config, Google AdMob에서 처리될 수 있는 앱 이용 이벤트, 기기 및 광고 관련 식별 정보',
    ],
  },
];

const purposes = [
  '회원 인증, 계정 유지, 프로필 표시',
  '친구 요청, 친구 목록, 약속 카드 생성과 공유',
  '약속 카드 응답 접수, 일정 확정, 일정 및 할 일 관리',
  '푸시 알림, 일정 리마인드, 응답 도착 안내',
  '공개 응답 남용 방지, 보안 사고 예방, 서비스 안정성 확인',
  '서비스 이용 분석, 기능 설정값 제공, 비개인화 광고 노출',
];

const retentionRules = [
  {
    title: '회원 및 프로필 정보',
    body: '회원 탈퇴 또는 계정 삭제 요청 처리 시까지 보관합니다. 탈퇴 후에도 법령상 보존 의무가 있거나 분쟁 대응에 필요한 경우 필요한 기간 동안 별도 보관할 수 있습니다.',
  },
  {
    title: '약속 카드와 응답 정보',
    body: '카드 운영, 응답 확인, 일정 확정을 위해 필요한 기간 동안 보관합니다. 응답 대기 또는 투표 중인 공개 카드는 만료 시 삭제될 수 있으며, 사용자가 삭제한 카드와 관련 응답은 함께 삭제됩니다.',
  },
  {
    title: '공개 응답 쿠키',
    body: '같은 브라우저의 중복 응답을 확인하기 위해 최대 180일 동안 보관합니다. 사용자는 브라우저 설정에서 쿠키를 삭제할 수 있습니다.',
  },
  {
    title: '알림 토큰 및 기기 정보',
    body: '알림 기능을 제공하는 동안 보관하며, 알림을 끄거나 로그아웃할 때 삭제 또는 해제될 수 있습니다.',
  },
  {
    title: '응답 제한 기록',
    body: 'IP 주소는 그대로 저장하지 않고 해시값으로 변환하여 공개 응답 남용 방지 목적에 필요한 기간 동안 보관합니다.',
  },
];

const externalServices = [
  {
    name: 'Supabase',
    purpose: '회원 인증, 데이터베이스, 실시간 동기화, 서버 기능 운영',
    data: '계정, 프로필, 친구, 약속 카드, 응답, 일정, 할 일, 알림 토큰, 응답 제한 기록',
  },
  {
    name: 'Google, Kakao',
    purpose: '소셜 로그인 인증',
    data: '사용자가 로그인 과정에서 제공에 동의한 계정 식별 정보, 이메일, 이름, 프로필 정보',
  },
  {
    name: 'Expo',
    purpose: '푸시 알림 발송',
    data: 'Expo 푸시 토큰, 알림 제목, 알림 본문, 알림 이동 정보',
  },
  {
    name: 'Google Firebase',
    purpose: '앱 분석, 원격 설정 제공, 안정성 개선',
    data: '앱 실행 및 이용 이벤트, 기기 정보, 앱 인스턴스 관련 정보',
  },
  {
    name: 'Google AdMob',
    purpose: '앱 내 광고 노출과 광고 성과 측정',
    data: '광고 요청 정보, 기기 및 광고 관련 식별 정보, 광고 노출 및 상호작용 정보',
  },
];

const rights = [
  '본인 개인정보의 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.',
  '앱에서 제공되는 프로필, 친구, 카드, 일정, 알림 설정 화면을 통해 일부 정보를 직접 수정하거나 삭제할 수 있습니다.',
  '앱에서 직접 처리하기 어려운 요청은 아래 문의 이메일로 접수할 수 있습니다.',
  '사용자가 자유 입력란에 입력한 정보는 카드 생성자 또는 카드 참여자에게 표시될 수 있으므로 필요한 범위의 정보만 입력해 주세요.',
];

const safeguards = [
  '서버 전용 Supabase service-role key는 웹 서버 환경에서만 사용하고 모바일 앱에 포함하지 않습니다.',
  '데이터베이스 Row Level Security 정책으로 사용자별 접근 범위를 제한합니다.',
  '공개 응답 중복 확인 쿠키는 httpOnly, sameSite 설정을 적용합니다.',
  '공개 응답 제한에는 원본 IP 주소 대신 HMAC 해시값을 사용합니다.',
  '푸시 알림 토큰은 알림 제공 목적에 한해 저장하고 알림 해제 또는 로그아웃 시 삭제를 시도합니다.',
];

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t-2 border-[var(--app-line)] py-8 first:border-t-0 first:pt-0">
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

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-[var(--app-background)] px-5 py-8 text-[var(--app-ink)] sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-[860px]">
        <header className="pb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border-2 border-[var(--app-line)] bg-[var(--app-lime-soft)]">
            <ShieldCheck aria-hidden="true" className="h-7 w-7 text-[var(--app-primary-deep)]" />
          </div>
          <p className="mt-5 text-sm font-black text-[var(--app-primary-deep)]">언제볼래</p>
          <h1 className="mt-2 text-[34px] font-black leading-tight text-[var(--app-ink)] sm:text-[42px]">
            개인정보처리방침
          </h1>
          <p className="mt-4 max-w-[700px] text-base font-bold leading-7 text-[var(--app-ink-muted)]">
            언제볼래는 약속 카드 생성, 친구 초대, 공개 응답, 일정 관리 기능을 제공하기 위해 필요한 범위의
            개인정보만 처리합니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-black text-[var(--app-ink)]">
            <span className="rounded-full border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1">
              시행일 {EFFECTIVE_DATE}
            </span>
            <span className="rounded-full border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1">
              최종 수정일 {EFFECTIVE_DATE}
            </span>
          </div>
        </header>

        <div className="app-card-shadow rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-5 py-6 sm:px-8 sm:py-8">
          <PolicySection id="scope" title="1. 적용 범위">
            <p>
              본 방침은 언제볼래 모바일 앱과 약속 카드 공개 응답 웹페이지에 적용됩니다. 사용자가 외부 로그인
              제공자, 광고, 푸시 알림 등 제3자 서비스를 이용하는 경우 해당 사업자의 개인정보 처리방침도 함께
              적용될 수 있습니다.
            </p>
          </PolicySection>

          <PolicySection id="collected-data" title="2. 처리하는 개인정보 항목">
            <div className="grid gap-5">
              {collectedDataGroups.map((group) => (
                <div key={group.title} className="min-w-0">
                  <h3 className="text-base font-black text-[var(--app-ink)]">{group.title}</h3>
                  <div className="mt-2">
                    <BulletList items={group.items} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-4">
              언제볼래는 주민등록번호, 여권번호, 운전면허번호, 결제정보, 휴대폰 연락처 전체, 정밀 위치정보를
              필수로 요구하지 않습니다. 다만 사용자가 제목, 장소, 메모, 한마디에 직접 입력한 내용은 그대로
              저장될 수 있으므로 민감한 정보는 입력하지 않는 것을 권장합니다.
            </p>
          </PolicySection>

          <PolicySection id="purpose" title="3. 개인정보 처리 목적">
            <BulletList items={purposes} />
          </PolicySection>

          <PolicySection id="retention" title="4. 보유 및 이용 기간">
            <div className="grid gap-4">
              {retentionRules.map((rule) => (
                <div key={rule.title}>
                  <h3 className="text-base font-black text-[var(--app-ink)]">{rule.title}</h3>
                  <p className="mt-1">{rule.body}</p>
                </div>
              ))}
            </div>
          </PolicySection>

          <PolicySection id="external-services" title="5. 외부 서비스 이용 및 처리위탁">
            <p>
              언제볼래는 서비스 제공에 필요한 범위에서 아래 외부 서비스를 이용합니다. 각 서비스는 자체 약관과
              개인정보 처리방침에 따라 정보를 처리할 수 있습니다.
            </p>
            <div className="mt-5 grid gap-4">
              {externalServices.map((service) => (
                <div key={service.name} className="rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-4">
                  <h3 className="text-base font-black text-[var(--app-ink)]">{service.name}</h3>
                  <p className="mt-1">
                    <span className="font-black text-[var(--app-ink)]">목적: </span>
                    {service.purpose}
                  </p>
                  <p className="mt-1">
                    <span className="font-black text-[var(--app-ink)]">처리 항목: </span>
                    {service.data}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5">
              광고 요청에는 가능한 경우 비개인화 광고 요청 옵션을 사용합니다. 다만 광고 SDK와 분석 SDK는 운영체제,
              기기 설정, 이용자의 동의 상태에 따라 별도의 식별자나 진단 정보를 처리할 수 있습니다.
            </p>
          </PolicySection>

          <PolicySection id="cookies" title="6. 쿠키 및 자동 수집 정보">
            <p>
              공개 응답 웹페이지는 같은 브라우저에서 이미 응답했는지 확인하기 위해 응답 확인 쿠키를 사용할 수
              있습니다. 또한 공개 응답 남용을 막기 위해 요청 IP 주소를 서버에서 해시 처리한 뒤 제한 횟수 확인에
              사용합니다. 웹 브라우저의 쿠키 저장을 거부하거나 삭제하면 일부 중복 응답 방지 기능이 제한될 수
              있습니다.
            </p>
          </PolicySection>

          <PolicySection id="rights" title="7. 이용자의 권리와 행사 방법">
            <BulletList items={rights} />
          </PolicySection>

          <PolicySection id="safeguards" title="8. 안전성 확보 조치">
            <BulletList items={safeguards} />
          </PolicySection>

          <PolicySection id="children" title="9. 아동의 개인정보">
            <p>
              언제볼래는 만 14세 미만 아동을 대상으로 서비스를 제공하지 않습니다. 만 14세 미만 아동의 개인정보가
              처리된 사실을 확인하면 필요한 확인 절차를 거쳐 삭제 등 필요한 조치를 진행합니다.
            </p>
          </PolicySection>

          <PolicySection id="contact" title="10. 개인정보 문의">
            <p>
              개인정보 열람, 정정, 삭제, 처리정지 요청이나 개인정보 관련 문의는 아래 연락처로 접수할 수 있습니다.
            </p>
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-coral-soft)] px-4 text-sm font-black text-[var(--app-ink)] transition active:scale-[0.99]">
              <Mail aria-hidden="true" className="h-4 w-4 text-[var(--app-primary-deep)]" />
              {PRIVACY_CONTACT_EMAIL}
            </a>
          </PolicySection>

          <PolicySection id="updates" title="11. 방침 변경">
            <p>
              본 개인정보처리방침은 법령, 서비스 기능, 외부 서비스 변경에 따라 수정될 수 있습니다. 중요한 변경이
              있는 경우 앱 또는 웹페이지를 통해 변경 내용을 알립니다.
            </p>
          </PolicySection>
        </div>
      </article>
    </main>
  );
}
