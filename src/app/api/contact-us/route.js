import { NextResponse } from "next/server";
import { randomUUID } from "crypto";


import openSearchClient from "../setup-database/_lib/route";

const INDEX_NAME = "contact_us_inquiries";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      subject,
      message
    } = body;

    // =========================
    // VALIDATION
    // =========================



    if (!email?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required"
        },
        { status: 400 }
      );
    }



    if (!message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required"
        },
        { status: 400 }
      );
    }

    // =========================
    // GENERATE ID
    // =========================

    const id = randomUUID();

    const now = new Date().toISOString();

    // =========================
    // CREATE DOCUMENT
    // =========================

    const inquiry = {
      id,

      name: name?.trim() || "",
      email: email.trim(),
      phone: phone?.trim() || "",

      subject: subject?.trim() || "",
      message: message.trim(),
      
      status: "new",
      created_at: now,
      updated_at: now
    };

    // =========================
    // INSERT INTO OPENSEARCH
    // =========================

    await openSearchClient.index({
      index: INDEX_NAME,

      // Same ID as document.id
      id,

      body: inquiry,

      // Make it immediately searchable
      refresh: true
    });

    // =========================
    // RESPONSE
    // =========================

    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been submitted successfully.",
        data: {
          id
        }
      },
      { status: 201 }
    );

  } catch (error) {

    console.error(
      "Contact inquiry submission failed:",
      error
    );
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit your inquiry."
      },
      { status: 500 }
    );
  }
}