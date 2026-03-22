import { useState } from "react";
import { Form, Link, useNavigate } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const categories = [
  "ヘアサロン",
  "ネイルサロン",
  "エステ",
  "リラクゼーション",
  "整体・整骨院",
  "歯科",
  "クリニック",
];

export default function TopPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (category) params.set("category", category);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <PublicLayout>
      {/* Hero section */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            かんたん予約で、
            <br className="sm:hidden" />
            もっと快適に
          </h1>
          <p className="mb-10 text-text-secondary">
            お近くのサロンや店舗を検索して、オンラインで予約しましょう
          </p>

          <Form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                name="keyword"
                placeholder="店舗名、エリア、メニュー名で検索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1"
              />
              <Select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="sm:w-44"
              >
                <option value="">カテゴリー</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="lg">
                検索
              </Button>
            </div>
          </Form>
        </div>
      </section>

      {/* Category links */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 text-center text-xl font-semibold">
            カテゴリーから探す
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/search?category=${encodeURIComponent(cat)}`}
                className="rounded-lg border border-border bg-white px-4 py-4 text-center text-sm font-medium text-text transition-colors hover:border-primary hover:bg-primary/5"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
