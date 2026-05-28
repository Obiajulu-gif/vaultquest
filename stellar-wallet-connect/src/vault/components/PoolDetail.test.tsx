import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PoolDetail, availableActions } from "./PoolDetail";
import type { PoolSummary, UserPosition } from "../contract/types";

const basePool: PoolSummary = {
  id: "pool-1",
  name: "Weekly USDC",
  status: "open",
  tvl: "10000",
  asset: "USDC",
  participantCount: 12,
  expectedYield: "5.2% APY",
  prize: "120 USDC",
  opensAt: "2026-05-01T00:00:00Z",
  locksAt: "2026-05-08T00:00:00Z",
  drawsAt: "2026-05-09T00:00:00Z",
};

const joined: UserPosition = {
  walletAddress: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  deposited: "500",
  shares: "500",
  joined: true,
};

describe("availableActions", () => {
  it("offers join when open and not joined", () => {
    expect(availableActions(basePool, null)).toEqual(["join"]);
  });
  it("offers drip and withdraw when open and joined", () => {
    expect(availableActions(basePool, joined)).toEqual(["drip", "withdraw"]);
  });
  it("offers claim and withdraw when settled and joined", () => {
    expect(availableActions({ ...basePool, status: "settled" }, joined)).toEqual(["claim", "withdraw"]);
  });
  it("offers nothing while drawing", () => {
    expect(availableActions({ ...basePool, status: "drawing" }, joined)).toEqual([]);
  });
});

describe("PoolDetail", () => {
  it("shows a loading state before data arrives", () => {
    render(<PoolDetail pool={null} loading />);
    expect(screen.getAllByText(/loading pool/i).length).toBeGreaterThan(0);
  });

  it("renders overview stats and status", () => {
    render(<PoolDetail pool={basePool} />);
    expect(screen.getByRole("heading", { name: "Weekly USDC" })).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("10,000 USDC")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("prompts to connect for the position when wallet is disconnected", () => {
    render(<PoolDetail pool={basePool} walletConnected={false} />);
    expect(screen.getByText(/wallet not connected/i)).toBeInTheDocument();
  });

  it("shows the user's position when joined", () => {
    render(<PoolDetail pool={basePool} position={joined} />);
    expect(screen.getByText("Your position")).toBeInTheDocument();
    expect(screen.getByText("GBBD47…FLA5")).toBeInTheDocument();
  });

  it("fires onAction when an action button is clicked", async () => {
    const onAction = vi.fn();
    render(<PoolDetail pool={basePool} position={null} onAction={onAction} />);
    await userEvent.click(screen.getByRole("button", { name: /join pool/i }));
    expect(onAction).toHaveBeenCalledWith("join");
  });

  it("renders an error state with retry", () => {
    render(<PoolDetail pool={null} error="nope" onRetry={() => {}} />);
    expect(screen.getByText(/couldn't load pool/i)).toBeInTheDocument();
  });
});
