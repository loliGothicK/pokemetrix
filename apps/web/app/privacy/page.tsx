"use client";

import { Box, Container, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getAppPalette } from "@/theme/palette";

export default function PrivacyPolicy() {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const palette = getAppPalette(theme.palette.mode);
  const isJa = i18n.language.startsWith("ja");

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {isJa ? "プライバシーポリシー" : "Privacy Policy"}
        </Typography>

        <Box
          sx={{
            mt: 4,
            "& h2": {
              fontSize: "1.5rem",
              fontWeight: 600,
              mt: 4,
              mb: 2,
              borderBottom: "1px solid",
              borderColor: palette.edge,
              pb: 1,
            },
            "& p": {
              mb: 2,
              lineHeight: 1.7,
              color: "text.secondary",
            },
            "& ul": {
              mb: 2,
              pl: 3,
              color: "text.secondary",
              lineHeight: 1.7,
            },
          }}
        >
          {isJa ? (
            <>
              <p>本プライバシーポリシーは、Pokemetrix（以下「本サービス」）が、本サービスを利用するユーザーの情報をどのように収集、利用、保護するかについて定めたものです。</p>

              <h2>1. 収集する情報</h2>
              <p>本サービスでは、アカウント登録および提供する機能のために以下の情報を収集する場合があります。</p>
              <ul>
                <li>メールアドレスおよびパスワード等の認証情報（アカウント作成時）</li>
                <li>ユーザーが作成・入力したパーティや対戦記録などのデータ</li>
                <li>サービス向上のためのエラーログ情報</li>
              </ul>
              <p>※本サービスは Google Analytics 等によるアクセス解析はおこなっておりません。</p>

              <h2>2. 情報の利用目的</h2>
              <p>収集した情報は、以下の目的で利用されます。</p>
              <ul>
                <li>本サービスの提供、およびユーザーによるデータの保存・閲覧のため</li>
                <li>本サービスの保守、改善、および不具合（バグ）の修正のため</li>
              </ul>

              <h2>3. 個人情報の第三者提供</h2>
              <p>本サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。</p>

              <h2>4. データの保護と管理</h2>
              <p>本サービスは、ユーザーの情報を適切に管理し、不正アクセスやデータの紛失・漏えいを防ぐために合理的なセキュリティ対策を講じます。ただし、インターネットを通じた情報の送信には完全な安全性が保証されるものではないことをご承知おきください。</p>

              <h2>5. プライバシーポリシーの変更</h2>
              <p>本サービスは、必要に応じて本プライバシーポリシーを変更することがあります。変更があった場合は、本ページにて通知します。</p>

              <h2>6. お問い合わせ</h2>
              <p>本プライバシーポリシーに関するご質問などは、フッターに記載の連絡先（Contact）よりお問い合わせください。</p>
            </>
          ) : (
            <>
              <p>This Privacy Policy describes how Pokemetrix ("we," "our," or "the Service") collects, uses, and protects information from users of our application.</p>

              <h2>1. Information We Collect</h2>
              <p>We may collect the following information to provide our services and account functionality:</p>
              <ul>
                <li>Authentication information, such as your email address and password (when creating an account).</li>
                <li>Data you create or input, such as team builds, battle records, and custom settings.</li>
                <li>Error logs to help us improve the service and fix bugs.</li>
              </ul>
              <p>* We do not use Google Analytics or other comprehensive tracking services.</p>

              <h2>2. How We Use Your Information</h2>
              <p>The information we collect is used for the following purposes:</p>
              <ul>
                <li>To provide, maintain, and personalize the Service for you.</li>
                <li>To identify, debug, and resolve technical issues.</li>
              </ul>

              <h2>3. Third-Party Sharing</h2>
              <p>We do not share your personal information with third parties without your consent, except as required by law.</p>

              <h2>4. Data Security</h2>
              <p>We implement reasonable security measures to protect your information from unauthorized access, loss, or disclosure. However, please be aware that no transmission of data over the internet is completely secure.</p>

              <h2>5. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>

              <h2>6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us using the Contact link in the footer.</p>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
