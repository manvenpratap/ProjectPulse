import { ProjectState } from "../types";

export async function analyzeProject(state: ProjectState) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ state }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "AI Synchronization failed");
  }

  const data = await response.json();
  return data.text;
}
