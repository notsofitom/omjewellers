import bcrypt from "bcryptjs";

if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error("Run this script in a terminal so it can hide your password while you type.");
  process.exit(1);
}

process.stdout.write("Choose a new OM Jewellers owner password (input hidden): ");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

let password = "";
process.stdin.on("data", async (key) => {
  if (key === "\u0003") {
    process.stdout.write("\nCancelled.\n");
    process.exit(130);
  }

  if (key === "\r" || key === "\n") {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write("\n");

    if (password.length < 12) {
      console.error("Use at least 12 characters, then run the script again.");
      process.exit(1);
    }

    process.stdout.write(`${await bcrypt.hash(password, 12)}\n`);
    password = "";
    process.exit(0);
  }

  if (key === "\u007f" || key === "\b") {
    password = password.slice(0, -1);
    return;
  }

  password += key;
});
