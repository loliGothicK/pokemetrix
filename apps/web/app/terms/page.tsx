"use client";

import { Box, Container, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getAppPalette } from "@/theme/palette";

export default function TermsOfService() {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const palette = getAppPalette(theme.palette.mode);
  const isJa = i18n.language.startsWith("ja");

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          {isJa ? "利用規約" : "Terms of Service"}
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
              <p>この利用規約（以下「本規約」）は、Pokemetrix（以下「本サービス」）の利用に関する条件を定めるものです。本サービスを利用することにより、ユーザーは本規約に同意したものとみなされます。</p>

              <h2>1. 非公式ファンサイトとしての免責事項</h2>
              <p>
                <strong>当サイトは非公式のファンサイトであり、任天堂株式会社、株式会社クリーチャーズ、株式会社ゲームフリーク、その他ポケットモンスター関連の権利を有する企業とは一切関係ありません。</strong>
                本サービス内で使用されているポケットモンスターに関する画像、名称などの知的財産権は、それぞれの正当な権利者に帰属します。
              </p>

              <h2>2. アカウントとセキュリティ</h2>
              <p>本サービスの一部機能を利用するためには、アカウントの作成が必要となる場合があります。ユーザーは自身のアカウント情報を安全に管理する責任を負い、アカウントの不正利用によって生じた損害について、本サービスは一切の責任を負いません。</p>

              <h2>3. 禁止事項</h2>
              <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
              <ul>
                <li>法令または公序良俗に違反する行為</li>
                <li>本サービスのサーバーやネットワーク機能に過度な負担をかける行為</li>
                <li>他のユーザーや第三者に不利益、損害、不快感を与える行為</li>
                <li>本サービスを不正な目的で利用する行為</li>
              </ul>

              <h2>4. サービスの提供の停止等</h2>
              <p>本サービスは、メンテナンス、システムの障害、その他の理由により、事前の通知なくサービスの全部または一部の提供を停止または中断することができるものとします。これによってユーザーに生じた損害について、本サービスは責任を負いません。</p>

              <h2>5. 免責事項</h2>
              <p>本サービスは、提供する情報（計算結果、ダメージ計算、統計データなど）の正確性、完全性、最新性について一切の保証を行いません。本サービスの利用に起因して生じたあらゆる損害について、本サービスは責任を負いかねます。</p>

              <h2>6. 利用規約の変更</h2>
              <p>本サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の規約は、本サービス上に掲示された時点から効力を生じるものとします。</p>

              <h2>7. お問い合わせ</h2>
              <p>本規約に関するご質問などは、フッターに記載の連絡先（Contact）よりお問い合わせください。</p>
            </>
          ) : (
            <>
              <p>These Terms of Service ("Terms") govern your use of Pokemetrix ("the Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>

              <h2>1. Disclaimer: Unofficial Fan Site</h2>
              <p>
                <strong>This site is an unofficial fan project and is NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with Nintendo Co., Ltd., Creatures Inc., GAME FREAK inc., or any of their subsidiaries or affiliates.</strong>
                All Pokémon-related images, names, and intellectual properties used in this Service belong to their respective copyright holders.
              </p>

              <h2>2. Accounts and Security</h2>
              <p>Certain features of the Service may require you to create an account. You are responsible for safeguarding your account information. We are not liable for any loss or damage arising from unauthorized use of your account.</p>

              <h2>3. Prohibited Activities</h2>
              <p>When using the Service, you agree not to:</p>
              <ul>
                <li>Engage in any activity that violates applicable laws or regulations.</li>
                <li>Attempt to interfere with or disrupt the servers or networks connected to the Service.</li>
                <li>Harass, abuse, or harm other users or third parties.</li>
                <li>Use the Service for any unauthorized or malicious purposes.</li>
              </ul>

              <h2>4. Service Modifications and Interruptions</h2>
              <p>We reserve the right to modify, suspend, or discontinue the Service (or any part of it) at any time without notice, due to maintenance, system failures, or other reasons. We will not be liable to you or any third party for any modification or interruption of the Service.</p>

              <h2>5. Limitation of Liability</h2>
              <p>The Service provides tools, calculations, and statistics on an "as is" and "as available" basis. We make no warranties regarding the accuracy, completeness, or reliability of any information provided. In no event shall the Service be liable for any damages arising out of or in connection with your use of the Service.</p>

              <h2>6. Changes to These Terms</h2>
              <p>We reserve the right to modify these Terms at any time. Any changes will be posted on this page and will become effective immediately upon posting. Your continued use of the Service constitutes acceptance of those changes.</p>

              <h2>7. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us using the Contact link in the footer.</p>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
