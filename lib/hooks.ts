"use client";

import { useState, useEffect, useCallback } from "react";
import type { Skill } from "./types";

interface SkillsResponse {
  skills: Skill[];
  total: number;
}

export function useSkills(filters?: {
  search?: string;
  category?: string;
  source?: string;
  scope?: string;
}) {
  const [data, setData] = useState<SkillsResponse>({ skills: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.source) params.set("source", filters.source);
      if (filters?.scope) params.set("scope", filters.scope);

      const res = await fetch(`/api/skills?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch skills");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.category, filters?.source, filters?.scope]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return { ...data, loading, error, refetch: fetchSkills };
}

export function useSkill(id: string) {
  const [skill, setSkill] = useState<(Skill & { rawContent: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSkill = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/skills/${id}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      setSkill(json);
    } catch {
      setSkill(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  return { skill, loading, refetch: fetchSkill };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
