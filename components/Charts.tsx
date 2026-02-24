"use client";

import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { DimensionId } from "@/lib/types";

export function Radar4D({ scores }: { scores: Record<DimensionId, number> }) {
  const data = [
    { dim: "Description", value: scores.D1 },
    { dim: "Delegation", value: scores.D2 },
    { dim: "Discernment", value: scores.D3 },
    { dim: "Diligence", value: scores.D4 },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#b8c4c2" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: "#44545d" }} />
          <Radar dataKey="value" stroke="#0f766e" fill="#0f766e" strokeWidth={2.5} fillOpacity={0.26} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Bars4D({ scores }: { scores: Record<DimensionId, number> }) {
  const data = [
    { dim: "D1", name: "Description", value: scores.D1 },
    { dim: "D2", name: "Delegation", value: scores.D2 },
    { dim: "D3", name: "Discernment", value: scores.D3 },
    { dim: "D4", name: "Diligence", value: scores.D4 },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#44545d" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#44545d" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(26, 38, 48, 0.16)",
              background: "rgba(255,255,255,0.95)"
            }}
          />
          <Bar dataKey="value" fill="#155b75" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
