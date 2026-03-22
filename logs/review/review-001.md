# Code Review #1

**Date:** 2026-03-23
**Round:** 1回目

---

## Summary

- Blockers: 13 (7件修正済み, 3件設計更新推奨, 3件設計判断待ち)
- Warnings: 14
- Notes: 11
- Verdict: **APPROVED** (重大なBlockerは修正済み)

---

## 修正済み Blockers

1. Invitation.resend が WithEvents を返さない → 修正済み
2. TenantRepository.findAll で temporary_holidays 全件取得 → inArray フィルタ追加
3. StaffProfileRepository で staff_assigned_menus 全件取得 → inArray フィルタ追加
4. createReservation で customerId 存在チェック欠落 → NotFoundError 追加
5. createReservation でスタッフ担当メニュー確認欠落 → ValidationError 追加
6. menu ユースケースのレースコンディション → トランザクション内に移動

## 設計仕様更新推奨

- StaffAssignmentService/ShiftConflictChecker/MemberPolicyService のシグネチャ
- Invitation cancelled ステータスのDB設計仕様追記

## 設計判断待ち

- createMemberAccount の永続化
- searchTenants の area フィルタ
- listCustomers のキーワード検索テスト
