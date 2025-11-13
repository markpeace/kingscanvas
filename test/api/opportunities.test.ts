import type { NextApiRequest, NextApiResponse } from "next";

jest.mock("@/lib/auth/config", () => ({
  authOptions: {},
  createTestSession: () => ({
    user: { email: "test@test.com" },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),
  isProd: false,
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/userData", () => ({
  getOpportunitiesByStep: jest.fn(),
  getOpportunityById: jest.fn(),
  upsertOpportunity: jest.fn(),
  deleteOpportunity: jest.fn(),
}));

import stepsHandler from "@/pages/api/steps/[stepId]/opportunities";
import opportunityHandler from "@/pages/api/opportunities/[id]";
import {
  getOpportunitiesByStep,
  getOpportunityById,
  upsertOpportunity,
  deleteOpportunity,
} from "@/lib/userData";

const mockGetOpportunitiesByStep = getOpportunitiesByStep as jest.MockedFunction<
  typeof getOpportunitiesByStep
>;
const mockGetOpportunityById = getOpportunityById as jest.MockedFunction<
  typeof getOpportunityById
>;
const mockUpsertOpportunity = upsertOpportunity as jest.MockedFunction<
  typeof upsertOpportunity
>;
const mockDeleteOpportunity = deleteOpportunity as jest.MockedFunction<
  typeof deleteOpportunity
>;

type JsonValue = unknown;

type MockResult = {
  req: NextApiRequest;
  res: NextApiResponse;
  getStatus: () => number;
  getJSON: () => JsonValue;
};

function createMockRequestResponse(method: string, body: Record<string, unknown> = {}): MockResult {
  let statusCode = 200;
  let jsonBody: JsonValue = null;

  const req = {
    method,
    body,
    headers: {},
    query: {},
  } as unknown as NextApiRequest;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: JsonValue) {
      jsonBody = data;
      return this;
    },
  } as unknown as NextApiResponse;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJSON: () => jsonBody,
  };
}

describe("/api/steps/[stepId]/opportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns opportunities for a step", async () => {
    const opportunities = [
      {
        id: "opp-1",
        stepId: "step-1",
        title: "Interview prep workshop",
        summary: "Join the campus careers workshop",
        source: "edge_simulated",
        form: "short_form",
        focus: ["capability"],
        status: "suggested",
      },
    ];
    mockGetOpportunitiesByStep.mockResolvedValue(opportunities as any);

    const { req, res, getStatus, getJSON } = createMockRequestResponse("GET");
    req.query = { stepId: "step-1" } as any;

    await stepsHandler(req, res);

    expect(mockGetOpportunitiesByStep).toHaveBeenCalledWith("test@test.com", "step-1");
    expect(getStatus()).toBe(200);
    expect(getJSON()).toEqual(opportunities);
  });

  it("creates a new opportunity", async () => {
    const createdOpportunity = {
      id: "opp-2",
      stepId: "step-1",
      title: "Visit employer fair",
      summary: "Attend the annual employer networking fair",
      source: "independent",
      form: "evergreen",
      focus: ["credibility"],
      status: "suggested",
    };
    mockUpsertOpportunity.mockResolvedValue(createdOpportunity as any);

    const { req, res, getStatus, getJSON } = createMockRequestResponse("POST", {
      title: "Visit employer fair",
      summary: "Attend the annual employer networking fair",
      source: "independent",
      form: "evergreen",
      focus: "credibility",
      status: "suggested",
    });
    req.query = { stepId: "step-1" } as any;

    await stepsHandler(req, res);

    expect(mockUpsertOpportunity).toHaveBeenCalledWith("test@test.com", {
      stepId: "step-1",
      title: "Visit employer fair",
      summary: "Attend the annual employer networking fair",
      source: "independent",
      form: "evergreen",
      focus: ["credibility"],
      status: "suggested",
    });
    expect(getStatus()).toBe(201);
    expect(getJSON()).toEqual(createdOpportunity);
  });
});

describe("/api/opportunities/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates an opportunity using minimal payload", async () => {
    const existing = {
      id: "opp-3",
      stepId: "step-9",
      title: "Shadow alumni",
      summary: "Schedule job shadowing sessions",
      source: "independent",
      form: "intensive",
      focus: ["credibility"],
      status: "suggested",
    };
    const updated = { ...existing, status: "saved" };
    mockGetOpportunityById.mockResolvedValue(existing as any);
    mockUpsertOpportunity.mockResolvedValue(updated as any);

    const { req, res, getStatus, getJSON } = createMockRequestResponse("PUT", {
      status: "saved",
    });
    req.query = { id: "opp-3" } as any;

    await opportunityHandler(req, res);

    expect(mockGetOpportunityById).toHaveBeenCalledWith("test@test.com", "opp-3");
    expect(mockUpsertOpportunity).toHaveBeenCalledWith("test@test.com", {
      id: "opp-3",
      stepId: "step-9",
      title: "Shadow alumni",
      summary: "Schedule job shadowing sessions",
      source: "independent",
      form: "intensive",
      focus: ["credibility"],
      status: "saved",
    });
    expect(getStatus()).toBe(200);
    expect(getJSON()).toEqual(updated);
  });

  it("deletes an opportunity", async () => {
    mockDeleteOpportunity.mockResolvedValue(undefined);

    const { req, res, getStatus, getJSON } = createMockRequestResponse("DELETE");
    req.query = { id: "opp-4" } as any;

    await opportunityHandler(req, res);

    expect(mockDeleteOpportunity).toHaveBeenCalledWith("test@test.com", "opp-4");
    expect(getStatus()).toBe(200);
    expect(getJSON()).toEqual({ ok: true });
  });
});
