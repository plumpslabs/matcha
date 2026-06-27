# /matcha:why

Run a 5W1H check on the current or proposed task before proceeding.

## Instructions for agent

Ask and answer all 6 questions about the current task.
If any answer is unclear → stop and ask the user before continuing.

```
🍵 matcha: 5W1H check

Task: [what was requested]

What:  [actual problem being solved]
Why:   [what breaks or is missing without this]
Who:   [what/who depends on this]
When:  [is this needed now, or is it premature?]
Where: [where in stack/codebase does this belong]
How:   [simplest full solution]

Confidence: [HIGH / MEDIUM / LOW]

If LOW or MEDIUM on Why or How → state what's unclear and ask user.
```