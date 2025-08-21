import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-lg font-semibold text-[var(--color-text-primary)]">
              RootEdu
            </div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              SKY 학생들이 만드는<br />
              전문적이고 양심적인 교육 플랫폼
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              서비스
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-tertiary)]">
              <li>
                <Link href="/influencers" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  인플루언서 탐색
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  커뮤니티
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  AI 학습 도구
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              지원
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-tertiary)]">
              <li>
                <Link href="/help" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              법적 고지
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-tertiary)]">
              <li>
                <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--color-text-secondary)] transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--color-border-secondary)]">
          <p className="text-center text-sm text-[var(--color-text-quaternary)]">
            © 2025 RootEdu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}