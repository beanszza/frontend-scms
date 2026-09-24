"use client";

import React from "react";

interface ProductionKpiCardsProps {
  totalRequests: number;
  pendingApprovalCount: number;
  activeBatchesCount: number;
}

export default function ProductionKpiCards({
  totalRequests,
  pendingApprovalCount,
  activeBatchesCount,
}: ProductionKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Total Production Requests */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Total Production Requests
          </span>
          <svg
            className="w-20 h-6 text-foreground"
            viewBox="0 0 80 24"
            fill="none"
          >
            <path
              d="M 2 18 C 14 22, 24 8, 38 14 C 52 20, 62 4, 76 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="76" cy="6" r="2.5" fill="currentColor" />
          </svg>
        </div>

        <div className="mt-4">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {totalRequests}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All created batches across all statuses
          </p>
        </div>
      </div>

      {/* Card 2: Pending Approval */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Pending Approval
          </span>
          <svg
            className="w-20 h-6 text-muted-foreground/70"
            viewBox="0 0 80 24"
            fill="none"
          >
            <path
              d="M 2 16 C 14 18, 26 8, 40 14 C 54 18, 64 6, 76 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="76" cy="6" r="2.5" fill="currentColor" />
          </svg>
        </div>

        <div className="mt-4">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {pendingApprovalCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requests awaiting administrator review
          </p>
        </div>
      </div>

      {/* Card 3: Active Production Batches */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Active in Production
          </span>
          <svg
            className="w-20 h-6 text-foreground"
            viewBox="0 0 80 24"
            fill="none"
          >
            <path
              d="M 2 18 C 16 20, 28 10, 42 16 C 56 20, 66 8, 76 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="76" cy="8" r="2.5" fill="currentColor" />
          </svg>
        </div>

        <div className="mt-4">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {activeBatchesCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Batches currently undergoing waterfall tracking
          </p>
        </div>
      </div>
    </div>
  );
}
