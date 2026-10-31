const THRESHOLD = 3000;
const ZONES = ["heel", "outer", "inner", "toe"];
const ZONE_LABEL = {
  heel: "heel (calcaneus)",
  outer: "outer metatarsal",
  inner: "inner metatarsal",
  toe: "big toe (hallux)",
};

function avg(rows, key) {
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + Number(r[key] || 0), 0) / rows.length;
}

function isAlert(row) {
  return ZONES.some((z) => Number(row[z]) > THRESHOLD);
}

function hourOf(ts) {
  return new Date(Number(ts)).getHours();
}

function generateInsights(rows) {
  if (!rows.length) {
    return [
      {
        id: "empty",
        severity: "info",
        title: "No pressure history yet",
        body: "Connect the insole (or start the live demo walk) so we can learn your gait. Insights update automatically from every saved sample.",
        correction: "Take a 2-minute walk with the insole active to generate your first profile.",
      },
    ];
  }

  const insights = [];
  const avgs = Object.fromEntries(ZONES.map((z) => [z, avg(rows, z)]));
  const dominant = ZONES.reduce((a, b) => (avgs[a] > avgs[b] ? a : b));
  const alertRows = rows.filter(isAlert);
  const alertRate = alertRows.length / rows.length;
  const peak = rows.reduce(
    (m, r) => {
      for (const z of ZONES) {
        if (Number(r[z]) > m.value) return { value: Number(r[z]), zone: z, ts: r.timestamp };
      }
      return m;
    },
    { value: 0, zone: "heel", ts: rows[0].timestamp }
  );

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last24 = rows.filter((r) => now - r.timestamp <= day);
  const prev24 = rows.filter((r) => now - r.timestamp > day && now - r.timestamp <= 2 * day);
  const lastAlerts = last24.filter(isAlert).length;
  const prevAlerts = prev24.filter(isAlert).length;

  insights.push({
    id: "dominant",
    severity: avgs[dominant] > 2200 ? "alert" : "warn",
    title: `Load is concentrating on your ${ZONE_LABEL[dominant]}`,
    body: `Across ${rows.length} samples, average ${dominant} pressure is ${Math.round(avgs[dominant])} units — the highest of all four sensors (heel ${Math.round(avgs.heel)}, outer ${Math.round(avgs.outer)}, inner ${Math.round(avgs.inner)}, toe ${Math.round(avgs.toe)}).`,
    correction:
      dominant === "heel"
        ? "Try shortening your stride to land mid-foot, reducing impact on the calcaneus by ~40%."
        : dominant === "toe"
        ? "Ease off forceful toe-off. Think 'quiet feet' and let the whole forefoot share push-off."
        : dominant === "outer"
        ? "You may be supinating. Cue a slight inward roll so the first ray shares load with the fifth."
        : "You may be over-pronating. A firmer medial arch cue (short-foot) can unload the inner metatarsal.",
  });

  if (avgs.heel > avgs.inner * 1.25 && avgs.heel > avgs.outer * 1.2) {
    insights.push({
      id: "heel-strike",
      severity: "alert",
      title: "Severe heel-striking pattern detected",
      body: `Heel load is ${Math.round((avgs.heel / Math.max(1, (avgs.inner + avgs.outer) / 2)) * 100 - 100)}% higher than midfoot. That spike pattern is typical of overstriding on morning walks.`,
      correction: "Shorten your stride and land closer to mid-foot. Keep cadence near 170–180 steps/min to cut calcaneal impact.",
    });
  }

  if (avgs.toe > 1800) {
    insights.push({
      id: "toe",
      severity: avgs.toe > 2400 ? "alert" : "warn",
      title: "Continuous pressure on the hallux",
      body: `Your walking pattern parks load on the big toe (avg ${Math.round(avgs.toe)}). Diabetic tissue under the hallux is high-risk for ulcers when pressure stays elevated.`,
      correction: "Change your walking pattern: roll through the whole forefoot and avoid clawing the toes at push-off.",
    });
  }

  const imbalance = avgs.inner - avgs.outer;
  if (Math.abs(imbalance) > 180) {
    insights.push({
      id: "imbalance",
      severity: "warn",
      title: imbalance > 0 ? "Medial (inner) overload — pronation cue" : "Lateral (outer) overload — supination cue",
      body: `Inner vs outer metatarsal average differs by ${Math.round(Math.abs(imbalance))} units. Repeated side-loading creates hot spots along one ray.`,
      correction:
        imbalance > 0
          ? "Gently lift the inner arch (short-foot exercise) for 10 steps, then resume walking."
          : "Allow a softer landing so the first metatarsal shares the step instead of dumping load to the outer border.",
    });
  }

  const buckets = { morning: 0, midday: 0, evening: 0, night: 0 };
  const bucketAlerts = { morning: 0, midday: 0, evening: 0, night: 0 };
  for (const r of rows) {
    const h = hourOf(r.timestamp);
    const b = h < 11 ? "morning" : h < 16 ? "midday" : h < 21 ? "evening" : "night";
    buckets[b] += 1;
    if (isAlert(r)) bucketAlerts[b] += 1;
  }
  const riskiest = Object.keys(bucketAlerts).sort(
    (a, b) => bucketAlerts[b] / Math.max(1, buckets[b]) - bucketAlerts[a] / Math.max(1, buckets[a])
  )[0];
  insights.push({
    id: "tod",
    severity: bucketAlerts[riskiest] > 8 ? "alert" : "info",
    title: `Highest ulcer-risk window: ${riskiest}`,
    body: `${bucketAlerts[riskiest]} red-alert samples landed in the ${riskiest} window (threshold > ${THRESHOLD}). Peak reading was ${peak.value} on the ${ZONE_LABEL[peak.zone]}.`,
    correction: `Schedule a 3-minute offloading break during ${riskiest} walks. Sit, unweight the ${peak.zone}, then resume.`,
  });

  insights.push({
    id: "alerts",
    severity: alertRate > 0.18 ? "alert" : alertRate > 0.08 ? "warn" : "ok",
    title:
      alertRate > 0.18
        ? "Red-alert frequency is in the danger band"
        : alertRate > 0.08
        ? "Intermittent high-pressure events"
        : "Alert rate is currently controlled",
    body: `${alertRows.length} of ${rows.length} samples (${Math.round(alertRate * 100)}%) crossed ${THRESHOLD}. Last 24h: ${lastAlerts} alerts vs ${prevAlerts} the day before.`,
    correction:
      lastAlerts < prevAlerts
        ? "Keep the current cadence and footwear. Offloading is working — stay consistent for another 48 hours."
        : "Insert a 90-second standing break every 10 minutes of walking until daily alerts trend down.",
  });

  let longest = 0;
  let run = 0;
  for (const r of rows) {
    if (isAlert(r)) {
      run += 1;
      longest = Math.max(longest, run);
    } else run = 0;
  }
  insights.push({
    id: "streak",
    severity: longest > 6 ? "alert" : "info",
    title: longest > 6 ? "Sustained hot-spot (not just a spike)" : "Pressure recovers between steps",
    body:
      longest > 6
        ? `We saw a streak of ${longest} consecutive over-threshold samples. Tissue ischemia risk rises when pressure never fully unloads.`
        : `Longest consecutive alert streak is ${longest}. Capillary refill between steps looks healthier than a locked hot-spot.`,
    correction:
      longest > 6
        ? "Stop and fully unweight that foot for 2 minutes, then check the skin over the glowing sensor zone."
        : "Continue even cadence. If a zone starts glowing on Home, treat it as a live offload cue.",
  });

  if (last24.length && prev24.length) {
    insights.push({
      id: "trend",
      severity: lastAlerts <= prevAlerts ? "ok" : "alert",
      title: lastAlerts <= prevAlerts ? "24-hour load is easing" : "24-hour load is climbing",
      body: `Alerts moved from ${prevAlerts} yesterday to ${lastAlerts} today. Average heel ${Math.round(avg(last24, "heel"))} / toe ${Math.round(avg(last24, "toe"))}.`,
      correction:
        lastAlerts <= prevAlerts
          ? "Condition trajectory is favorable — keep the shorter stride and scheduled breaks."
          : "Condition is deteriorating: reduce continuous walking blocks and inspect the plantar skin after this session.",
    });
  }

  return insights.slice(0, 7);
}

function improvementStatus(rows) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last = rows.filter((r) => now - r.timestamp <= day);
  const prev = rows.filter((r) => now - r.timestamp > day && now - r.timestamp <= 2 * day);
  const lastAlerts = last.filter(isAlert).length;
  const prevAlerts = prev.filter(isAlert).length;
  const improving = lastAlerts <= prevAlerts;
  const delta = prevAlerts === 0 ? (lastAlerts === 0 ? 0 : 100) : Math.round(((lastAlerts - prevAlerts) / prevAlerts) * 100);

  return {
    improving,
    badge: improving ? "Condition Improving" : "Condition Deteriorating: High Ulcer Risk",
    lastAlerts,
    prevAlerts,
    lastSamples: last.length,
    prevSamples: prev.length,
    deltaPct: delta,
    threshold: THRESHOLD,
  };
}

function downsample(rows, maxPoints = 180) {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  const out = [];
  for (let i = 0; i < rows.length; i += step) out.push(rows[i]);
  return out;
}

module.exports = { generateInsights, improvementStatus, downsample, THRESHOLD, isAlert };
