import { NextResponse } from "next/server";
import { generateOpenAPISpec } from "@/lib/openapi/generate-spec";

export async function GET() {
  const spec = generateOpenAPISpec();
  return NextResponse.json(spec);
}
