import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwnerAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerEmail = typeof body.email === "string" ? body.email.trim() : "";
    const customerPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const productReference = typeof body.productReference === "string" ? body.productReference.trim() : null;

    const validWhatsapp = !customerPhone ||
      (customerPhone.startsWith("+") && /^\+[1-9][0-9\s().-]{7,28}$/.test(customerPhone) &&
        customerPhone.replace(/\D/g, "").length <= 15);

    if (customerPhone && !validWhatsapp) {
      return NextResponse.json({ error: "WhatsApp number must include a country code, such as +91 98765 43210." }, { status: 400 });
    }

    if (!customerName || customerName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || customerEmail.length > 200 || message.length < 3 || message.length > 2000) {
      return NextResponse.json({ error: "Please enter a valid name, email and message." }, { status: 400 });
    }

    let productImagePath: string | null = null;
    if (productReference) {
      const product = await prisma.product.findFirst({
        where: { reference: productReference, isActive: true },
        select: { reference: true, imagePath: true },
      });
      if (!product) return NextResponse.json({ error: "That product is no longer available." }, { status: 404 });
      productImagePath = product.imagePath;
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        message,
        productReference,
        productImagePath,
      },
      select: { id: true, createdAt: true },
    });

    let emailSent = false;
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.SHOP_ENQUIRY_EMAIL;
    const sender = process.env.RESEND_FROM_EMAIL;

    if (apiKey && recipient && sender) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: sender,
            to: [recipient],
            reply_to: customerEmail,
            subject: `New jewellery enquiry${productReference ? `: ${productReference}` : ""}`,
            text: [
              `From: ${customerName}`,
              `Email: ${customerEmail}`,
              `Phone: ${customerPhone || "Not provided"}`,
              `Product: ${productReference || "General enquiry"}`,
              "",
              message,
              `Enquiry ID: ${enquiry.id}`,
            ].join("\n"),
          }),
        });
        emailSent = emailResponse.ok;
        if (!emailSent) console.error("Enquiry email delivery failed:", emailResponse.status);
      } catch (emailError) {
        console.error("Enquiry email request failed:", emailError);
      }
    }

    return NextResponse.json({ saved: true, emailSent, emailConfigured: Boolean(apiKey && recipient && sender), id: enquiry.id }, { status: 201 });
  } catch (error) {
    console.error("Could not save customer enquiry:", error);
    return NextResponse.json({ error: "Could not save your enquiry. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(enquiries, { headers: { "Cache-Control": "no-store" } });
}
