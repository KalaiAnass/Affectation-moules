# User Guide

A quick guide for technicians and process engineers.

## Signing in

Open the application and click **Sign in**. In production you are redirected to the company
SSO (Azure AD). In a local/demo environment, pick a role on the sign-in screen.

## Checking a mold against a press

1. On the home screen, choose a **Press** and a **Mold** from the two selectors
   (type to search by id, brand, or designation).
2. Click **Check Compatibility**.
3. Read the result:

   - **COMPATIBLE** (green) — the mold can be mounted.
   - **COMPATIBLE · adaptation** (amber) — mountable, but an action is required
     (e.g. *Rotation required during insertion*, *Use centering washer*). Follow the
     highlighted instruction on the relevant card.
   - **NOT COMPATIBLE** (red) — at least one blocking rule failed. The header lists which.

4. Each rule is shown as a card with the **press value**, the **mold value**, and a plain
   explanation, so the decision is never a black box.

### How to read the ten rules

| Card | What it means |
|------|---------------|
| Thickness | The mold thickness fits the press min/max window |
| Mountability | The mold enters the clamping area (straight, rotated, or not at all) |
| Bridage (MAG) | Clamping system match; may need a centering washer or locating studs |
| Heating Zones | The press has at least as many heating zones as the mold needs |
| Hydraulic Cores | The press has enough core circuits (fixed & moving halves) |
| Thermoregulation | The press has enough thermo connections (PF / PM / grid) |
| Sequential Control | The press has enough sequential outputs for the mold's nozzles |
| Clamping Force | The press tonnage covers the mold's required force |

## Compatibility matrix

**Matrix** tests **one mold against every press** at once — useful when planning where a tool
can run. Each press shows a green/amber/red chip; failures list the blocking rule(s).

## Reverse search

**Reverse** tests **one press against every mold** — useful when a machine is free and you
want to know what can run on it now.

## Audit history

**Audit** (Administrators & Engineers) lists every check performed — who, when, which press
and mold, and the result — for full traceability.

## Tips

- Amber never means "no": it means "yes, with this specific preparation".
- The press/mold values on each card are the exact figures the decision used — handy for
  double-checking against the physical equipment.
