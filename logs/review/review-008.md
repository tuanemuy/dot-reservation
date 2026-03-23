# Code Review #8

**Date:** 2026-03-23
**Round:** 1回目 (全体再実装後)

---

## Summary

- Blockers: 7
- Warnings: 7
- Notes: 12
- Verdict: **BLOCKED**

---

## ドメイン層 + アダプター層

### Blockers
なし

### Warnings
- **[W-D001]** StaffProfile.create() が WithEvents を返していない
- **[W-D002]** Notification.create() が WithEvents を返していない
- **[W-D003]** AvailabilityService の TimeOfDay 処理の一貫性
- **[W-D004]** S3StorageManager の endpoint パラメータの Optional 処理
- **[W-D005]** Nodemailer アダプターの HTML メール形式が簡素

## ユースケース層 + テスト

### Blockers
- **[B-U001]** removeMember/deleteMemberAccount で「担当者未定」への予約変更処理が欠落
- **[B-U002]** createProxyReservation でスタッフの権限チェックが欠落
- **[B-U003]** createProxyReservation で過去日付のバリデーションが欠落
- **[B-U004]** removeMember テストでメンバー削除通知のテストケースが欠落
- **[B-U005]** Event Relay Worker に member.removed ハンドラが欠落
- **[B-U006]** changeMemberRole で ConflictError ではなく BusinessRuleError がスロー

## フロントエンド

### Blockers
- **[B-F001]** console.log が本番コードに残存

### Warnings
- **[W-F001]** console.error の多用
- **[W-F002]** presetStaffId での auto-advance 未対応
