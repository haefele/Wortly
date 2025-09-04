"use client";

import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  const [searchText, setSearchText] = useState<string>("");
  const word = useQuery(api.words.findWord, { word: searchText });

  return (
    <>
      <PageHeader 
        title="Dashboard"
        description="Search and explore German words"
      />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col max-w-lg mx-auto">
          <h1>Find word:</h1>
          <Input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search for a word..." />
        </div>

        {word ? <div className="flex flex-col max-w-lg mx-auto mt-4">
          <h2>Results:</h2>
          <p>{word.word}</p>
        </div> : null}
      </main>
    </>
  );
}