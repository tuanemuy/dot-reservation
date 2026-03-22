import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";

// TODO: action でテナント登録処理を実装

export default function AdminNewTenantPage() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [step, setStep] = useState(1);

  // フォームデータの一時保持
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    urlPath: "",
    postalCode: "",
    address: "",
    phone: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">テナント新規登録</h1>
          <p className="mt-2 text-sm text-gray-600">新しい店舗を登録します</p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s === step
                    ? "bg-blue-600 text-white"
                    : s < step
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`mx-2 h-0.5 w-12 ${
                    s < step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {actionData?.error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{actionData.error}</p>
          </div>
        )}

        {/* ステップ1: 基本情報 */}
        {step === 1 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              基本情報
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  テナント名
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: ヘアサロン dot"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  カテゴリー
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="hair">美容室</option>
                  <option value="nail">ネイルサロン</option>
                  <option value="esthetic">エステサロン</option>
                  <option value="clinic">クリニック</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="urlPath"
                  className="block text-sm font-medium text-gray-700"
                >
                  URLパス
                </label>
                <input
                  id="urlPath"
                  type="text"
                  required
                  value={formData.urlPath}
                  onChange={(e) => updateField("urlPath", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: hair-salon-dot"
                />
                <p className="mt-1 text-xs text-gray-500">
                  公開ページのURLに使用されます
                </p>
                {/* TODO: リアルタイム使用可否チェック */}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ステップ2: 所在地・連絡先 */}
        {step === 2 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              所在地・連絡先
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  郵便番号
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="123-4567"
                />
                {/* TODO: 郵便番号による住所自動補完 */}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  住所
                </label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="東京都渋谷区..."
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  電話番号
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="03-1234-5678"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ステップ3: 確認 */}
        {step === 3 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              入力内容の確認
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  テナント名
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.name || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  カテゴリー
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.category || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">URLパス</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.urlPath || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">郵便番号</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.postalCode || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">住所</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.address || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formData.phone || "-"}
                </dd>
              </div>
            </dl>

            <Form method="post" className="mt-6">
              <input type="hidden" name="name" value={formData.name} />
              <input type="hidden" name="category" value={formData.category} />
              <input type="hidden" name="urlPath" value={formData.urlPath} />
              <input
                type="hidden"
                name="postalCode"
                value={formData.postalCode}
              />
              <input type="hidden" name="address" value={formData.address} />
              <input type="hidden" name="phone" value={formData.phone} />

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  戻る
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "登録中..." : "テナントを登録"}
                </button>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
