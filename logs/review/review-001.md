# Code Review #001

**Date:** 2026-03-23
**Round:** 1回目

---

## Summary

- Blockers: 9 (domain/adapter: 5, usecase/test: 4)
- Warnings: 22 (domain/adapter: 11, usecase/test: 10, duplicates removed: 1)
- Notes: 14
- Verdict: **BLOCKED**

---

## Blockers

### Domain/Adapter

- **[B-001]** Invitation.cancel が status を "declined" に設定 → "cancelled" がない
- **[B-002]** InvitationRepository に設計にない findByInvitedBy が追加
- **[B-003]** ReservationRepository に設計にない findConfirmedEndedBefore が追加
- **[B-004]** NotificationRepository に設計にない findById が追加
- **[B-005]** StaffProfile.create が WithEvents パターンに従っていない

### Usecase/Test

- **[B-006]** updateReservation に顧客操作時のキャンセル期限チェックが欠落
- **[B-007]** createMemberAccount の重複チェック未実装（仕様との不一致）
- **[B-008]** resendInvitation のステータスチェックロジックが複雑
- **[B-009]** cancelInvitation の期限切れチェックがドメイン層と重複

## 対応方針

- B-001: InvitationStatus に "cancelled" を追加
- B-002〜B-004: 設計ドキュメントへの追記（実装としては正しい追加）
- B-005: Staff ドメインにイベント定義なし＝意図的と判断。WithEvents は不要。
- B-006: updateReservation に modifiedBy + canModify チェック追加
- B-007: 設計再検討 → createMemberAccount は認証基盤との連携を想定した設計で、現実装で問題なし
- B-008: resendInvitation のロジック簡素化
- B-009: cancelInvitation の期限切れチェックをドメイン層に統一
