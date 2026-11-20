# Hotel Revenue Management Metrics Documentation

This document formalizes the mathematical formulas, boundary calculation rules, SQL aggregation queries, and database index design for **The Bombay Reserve** hospitality analytics engine.

---

## 1. Metric Definitions & Formulas

All financial figures are normalized to **Indian Rupees (INR)**.

### 1.1 Room-Nights Available ($A$)
The total potential room inventory capacity of a property (or across all collective properties) over the requested calendar interval $[from, to)$:

$$A = \sum_{p \in \text{Properties}} \left( N_{\text{rooms}, p} \times D \right)$$

Where:
* $N_{\text{rooms}, p}$ is the count of physical rooms in property $p$.
* $D = \text{days between } from \text{ and } to = to - from$.

---

### 1.2 Room-Nights Sold ($S$)
The total count of occupied room nights within the evaluation window $[from, to)$, excluding cancelled reservations.

For any non-cancelled booking $b$ with stay interval $[b.\text{checkIn}, b.\text{checkOut})$, the number of nights falling strictly within $[from, to)$ is:

$$\text{overlapNights}(b) = \max\left(0, \min(b.\text{checkOut}, to) - \max(b.\text{checkIn}, from)\right)$$

Summing across all valid bookings:

$$S = \sum_{b \in \text{ValidBookings}} \text{overlapNights}(b)$$

---

### 1.3 Room Revenue ($R$)
The total accommodation rental revenue realized strictly for the nights within $[from, to)$.

For each booking $b$:
* Total duration: $N_{b} = b.\text{checkOut} - b.\text{checkIn}$.
* Nightly rate: $r_{b} = \frac{b.\text{totalInr}}{N_{b}}$.
* Attributable revenue in range: $\text{revenue}(b) = \text{overlapNights}(b) \times r_{b}$.

$$R = \sum_{b \in \text{ValidBookings}} \left( \text{overlapNights}(b) \times \frac{b.\text{totalInr}}{b.\text{checkOut} - b.\text{checkIn}} \right)$$

---

### 1.4 Occupancy Rate ($\text{Occ}$)
The percentage of available room inventory that was occupied during the period:

$$\text{Occ} = \frac{S}{A} = \frac{\text{Room-Nights Sold}}{\text{Room-Nights Available}}$$

* When $A = 0$, $\text{Occ} = 0$.
* Formatted as a decimal with 4 decimal places (e.g., $0.7500 = 75.00\%$).

---

### 1.5 Average Daily Rate ($\text{ADR}$)
The average revenue earned per occupied room night sold during the period:

$$\text{ADR} = \frac{R}{S} = \frac{\text{Room Revenue}}{\text{Room-Nights Sold}}$$

* When $S = 0$, $\text{ADR} = 0$.
* Formatted in INR with 2 decimal places.

---

### 1.6 Revenue Per Available Room ($\text{RevPAR}$)
The total revenue earned per available room night across the entire inventory, capturing both occupancy and pricing efficiency:

$$\text{RevPAR} = \frac{R}{A} = \frac{\text{Room Revenue}}{\text{Room-Nights Available}}$$

* When $A = 0$, $\text{RevPAR} = 0$.
* Formatted in INR with 2 decimal places.

---

## 2. Mathematical Proof: $\text{RevPAR} = \text{Occupancy} \times \text{ADR}$

**Theorem**: $\text{RevPAR} = \text{Occupancy} \times \text{ADR}$.

**Proof**:
By definition:
$$\text{Occupancy} = \frac{S}{A}$$
$$\text{ADR} = \frac{R}{S}$$

Multiply $\text{Occupancy}$ by $\text{ADR}$:
$$\text{Occupancy} \times \text{ADR} = \left(\frac{S}{A}\right) \times \left(\frac{R}{S}\right)$$

Since $S > 0$, the $S$ in the numerator and denominator cancel:
$$\text{Occupancy} \times \text{ADR} = \frac{R}{A}$$

By definition, $\frac{R}{A} = \text{RevPAR}$.

**Degenerate Cases**:
1. If $S = 0$ (no rooms sold):
   * $R = 0$
   * $\text{Occupancy} = 0 / A = 0$
   * $\text{ADR} = 0$
   * $\text{RevPAR} = 0 / A = 0$
   * $\text{Occupancy} \times \text{ADR} = 0 \times 0 = 0 = \text{RevPAR}$.
2. If $A = 0$ (no rooms in inventory):
   * All metrics evaluate to $0$.

Thus, $\text{RevPAR} = \text{Occupancy} \times \text{ADR}$ holds unconditionally under all hospitality operating conditions. $\blacksquare$

---

## 3. Date Boundary Handling Rules

Consider evaluation window $[from, to) = [2026\text{-}10\text{-}10, 2026\text{-}10\text{-}15)$ ($D = 5$ nights):

```
Query Window:      [Oct 10 ---------------- Oct 15)
Case 1 (Enclosed):     [Oct 11 ---- Oct 14)       => 3 nights (Oct 11, 12, 13)
Case 2 (Left Span): [Oct 08 ------- Oct 12)       => 2 nights (Oct 10, 11)
Case 3 (Right Span):        [Oct 13 ----------- Oct 18) => 2 nights (Oct 13, 14)
Case 4 (Encompassing): [Oct 05 ----------------- Oct 20) => 5 nights (all 5)
Case 5 (Outside Left): [Oct 02 -- Oct 09)         => 0 nights
Case 6 (Outside Right):                    [Oct 15 -- Oct 18) => 0 nights
Case 7 (Cancelled):    [Oct 10 ---- Oct 14]       => 0 nights (excluded)
```

The overlap formula $\max\left(0, \min(checkOut, to) - \max(checkIn, from)\right)$ handles all 7 cases identically.

---

## 4. SQL Aggregation Implementation

### 4.1 Property Summary Query
```sql
WITH date_range AS (
  SELECT
    $1::date AS range_from,
    $2::date AS range_to,
    CAST($2::date - $1::date AS INT) AS range_days
),
property_inventory AS (
  SELECT
    p.id AS property_id,
    p.name AS property_name,
    COUNT(r.id) AS total_rooms,
    COUNT(r.id) * dr.range_days AS room_nights_available
  FROM properties p
  CROSS JOIN date_range dr
  LEFT JOIN rooms r ON r."propertyId" = p.id
  WHERE ($3::text IS NULL OR p.id = $3)
  GROUP BY p.id, p.name, dr.range_days
),
booking_nights AS (
  SELECT
    r."propertyId" AS property_id,
    b.id AS booking_id,
    GREATEST(0, (LEAST(b."checkOut", dr.range_to) - GREATEST(b."checkIn", dr.range_from))) AS overlap_nights,
    b."totalInr" / GREATEST(1, (b."checkOut" - b."checkIn")) AS rate_per_night
  FROM bookings b
  JOIN rooms r ON b."roomId" = r.id
  CROSS JOIN date_range dr
  WHERE b.status != 'CANCELLED'
    AND b."checkIn" < dr.range_to
    AND b."checkOut" > dr.range_from
    AND ($3::text IS NULL OR r."propertyId" = $3)
)
SELECT
  pi.property_id,
  pi.property_name,
  pi.total_rooms,
  pi.room_nights_available,
  COALESCE(SUM(bn.overlap_nights), 0) AS room_nights_sold,
  ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0), 2) AS room_revenue_inr,
  CASE
    WHEN pi.room_nights_available > 0
    THEN ROUND(COALESCE(SUM(bn.overlap_nights), 0)::numeric / pi.room_nights_available::numeric, 4)
    ELSE 0
  END AS occupancy_rate,
  CASE
    WHEN COALESCE(SUM(bn.overlap_nights), 0) > 0
    THEN ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0)::numeric / SUM(bn.overlap_nights)::numeric, 2)
    ELSE 0
  END AS adr,
  CASE
    WHEN pi.room_nights_available > 0
    THEN ROUND(COALESCE(SUM(bn.overlap_nights * bn.rate_per_night), 0)::numeric / pi.room_nights_available::numeric, 2)
    ELSE 0
  END AS revpar
FROM property_inventory pi
LEFT JOIN booking_nights bn ON bn.property_id = pi.property_id
GROUP BY pi.property_id, pi.property_name, pi.total_rooms, pi.room_nights_available
ORDER BY pi.property_name ASC;
```

---

## 5. Database Indexing Strategy

To guarantee sub-second dashboard aggregation queries across large booking tables (300,000+ rows):

1. **Composite Covering Index on Bookings**:
   ```sql
   CREATE INDEX idx_bookings_status_dates ON bookings (status, "checkIn", "checkOut", "roomId");
   ```
   * Enables index-only scans for `status != 'CANCELLED' AND checkIn < $2 AND checkOut > $1`.
   * Directly extracts `checkIn`, `checkOut`, and `roomId` from the B-tree index without visiting heap tables.

2. **Index on Room Property Mapping**:
   ```sql
   CREATE INDEX idx_rooms_property_status ON rooms ("propertyId", status);
   ```
   * Accelerates inventory counting per property.
