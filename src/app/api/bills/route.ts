import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

type IncomingBillItem = {
  description?: unknown;
  weight?: unknown;
  metalAmount?: unknown;
  labourCharge?: unknown;
};

export async function POST(request: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const phoneDigits = typeof body.customerPhone === "string" ? body.customerPhone.replace(/\D/g, "") : "";
    if (!customerName) {
      return NextResponse.json({ error: "Enter the customer's name." }, { status: 400 });
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Enter a valid customer phone number with country code if needed." }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
      return NextResponse.json({ error: "Add between 1 and 30 bill items." }, { status: 400 });
    }

    const items: { description: string; weight: number; metalAmount: number; labourCharge: number; lineTotal: number }[] = [];
    for (const item of body.items as IncomingBillItem[]) {
      const description = typeof item.description === "string" ? item.description.trim() : "";
      const weight = item.weight === "" || item.weight === null || item.weight === undefined ? 0 : Number(item.weight);
      const metalAmount = Number(item.metalAmount);
      const labourCharge = Number(item.labourCharge);
      if (!description) {
        return NextResponse.json({ error: "Give every bill item a name or description." }, { status: 400 });
      }
      if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(metalAmount) || metalAmount < 0 || !Number.isFinite(labourCharge) || labourCharge < 0) {
        return NextResponse.json({ error: "Weight, item value and labour charge must be zero or more." }, { status: 400 });
      }
      const roundedMetalAmount = roundMoney(metalAmount);
      const roundedLabourCharge = roundMoney(labourCharge);
      items.push({
        description,
        weight: roundMoney(weight),
        metalAmount: roundedMetalAmount,
        labourCharge: roundedLabourCharge,
        lineTotal: roundMoney(roundedMetalAmount + roundedLabourCharge),
      });
    }

    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    if (subtotal <= 0) {
      return NextResponse.json({ error: "The bill total before GST must be greater than zero." }, { status: 400 });
    }

    const cgst = roundMoney(subtotal * 0.015);
    const sgst = roundMoney(subtotal * 0.015);
    const total = roundMoney(subtotal + cgst + sgst);
    const settings = await prisma.billingSettings.findUnique({ where: { id: "shop" } });
    const shareToken = randomUUID().replaceAll("-", "");
    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const billNumber = `OMJ-${datePart}-${shareToken.slice(0, 6).toUpperCase()}`;
    const customerPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        shareToken,
        customerName,
        customerPhone,
        gstNumber: settings?.gstNumber ?? null,
        itemsJson: JSON.stringify(items),
        subtotal,
        cgst,
        sgst,
        total,
      },
      select: { billNumber: true, shareToken: true, customerName: true, customerPhone: true, total: true },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Could not create bill:", error);
    return NextResponse.json({ error: "Could not create this bill." }, { status: 500 });
  }
}
