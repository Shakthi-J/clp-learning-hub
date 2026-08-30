import { createAdminClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const CREATABLE_ROLES = ["patient", "instructor"];
const MIN_PASSWORD = 8;

export async function POST(request: Request) {
  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { name, email, password, access_type, role } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ message: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ message: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
  }

  // Admin is not creatable here on purpose - minting an admin stays a manual
  // action in the Supabase dashboard.
  const newRole = role ?? "patient";
  if (!CREATABLE_ROLES.includes(newRole)) {
    return NextResponse.json({ message: "Role must be patient or instructor" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createError) {
    if (createError.message.includes("already registered")) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: createError.message }, { status: 500 });
  }

  // A trigger creates the patients row on signup; this sets what the admin chose.
  const { error: profileError } = await admin.from("patients").update({
    name,
    role: newRole,
    access_type: access_type || "single_course",
  }).eq("auth_user_id", newUser.user.id);

  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: newUser.user.id, role: newRole }, { status: 201 });
}
