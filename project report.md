\# Smart Home Energy Efficiency Tracker: Fuzzy Logic System



\## 1. System Architecture

To avoid a massive rule base, the system follows a \*\*Hierarchical Fuzzy Inference System (HFIS)\*\* structure:

1\.  \*\*Level 1 (Room Inference):\*\* Calculates Efficiency for each of the 4 rooms.

2\.  \*\*Level 2 (Home Inference):\*\* Aggregates room efficiencies into a "Global Home Efficiency Score."



---



\## 2. Input Fuzzy Sets (Linguistic Variables)



All inputs are mapped to three fuzzy sets: \*\*Low (L), Medium (M), and High (H)\*\*.



\### A. AC Temperature (16°C - 28°C)

\*Note: Lower temperature = Higher energy consumption.\*

\- \*\*High Energy (Inefficient):\*\* 16°C to 20°C

\- \*\*Balanced:\*\* 18°C to 24°C

\- \*\*Low Energy (Efficient):\*\* 22°C to 28°C



\### B. Fans (Living/Bedrooms: 0-5 | Kitchen Exhaust: 0-3)

\- \*\*Low Speed:\*\* 0 to 1.5

\- \*\*Moderate:\*\* 1 to 3.5

\- \*\*High Speed (Inefficient):\*\* 3 to 5 (or 3 for exhaust)



\### C. Plug Power Consumption (0W - 3000W)

\- \*\*Standby/Low:\*\* 0W to 500W

\- \*\*Active:\*\* 400W to 1800W

\- \*\*Heavy Load:\*\* 1500W to 3000W



\### D. Lamp Intensity (0% - 100%)

\- \*\*Dim:\*\* 0% to 35%

\- \*\*Standard:\*\* 30% to 75%

\- \*\*Bright:\*\* 65% to 100%



---



\## 3. Output Fuzzy Sets



\### Room Efficiency (0% - 100%)

\- \*\*Poor:\*\* 0% to 40%

\- \*\*Average:\*\* 30% to 70%

\- \*\*Excellent:\*\* 60% to 100%



---



\## 4. Fuzzy Rule Base 



The logic uses \*\*Mamdani-style\*\* inference. Rules follow the pattern:

`IF (Input1 is X) AND (Input2 is Y) THEN (Efficiency is Z)`



| Rule ID | Thermal (AC/Fan) | Power (Plug) | Lighting (Lamp) | Room Efficiency |

| :------ | :--------------- | :----------- | :-------------- | :-------------- |

| R1      | High Speed/16°C  | Heavy Load   | Bright          | \*\*Poor\*\*        |

| R2      | Low Speed/28°C   | Low          | Dim             | \*\*Excellent\*\*   |

| R3      | Moderate         | Active       | Standard        | \*\*Average\*\*     |

| R4      | Low Speed        | Heavy Load   | Bright          | \*\*Average\*\*     |


Rule ID	Living	Parents	Son	Kitchen	Total Home Efficiency
H1	Poor	Poor	Poor	Poor	Critical
H2	Excellent	Excellent	Excellent	Excellent	Optimized
H3	Average	Average	Average	Average	Balanced
H4	Poor	-	-	-	Low (Weighted: Living room is a high-traffic area)
H5	Excellent	Excellent	Average	Average	High

---



\## 5. Logic Process (Inference Engine)



The system operates using the following mathematical steps:



1\.  \*\*Fuzzification:\*\* Crisp inputs (e.g., 20°C) are converted into membership degrees $\\mu$ using Triangular/Trapezoidal functions.

2\.  \*\*Fuzzy Operators:\*\* For "AND" logic, the \*\*Minimum\*\* (Mamdani) operator is used:

&nbsp;   $$\\mu\_{A \\cap B} = \\min(\\mu\_A(x), \\mu\_B(y))$$

3\.  \*\*Implication:\*\* The rule's antecedent (the "If" part) reshapes the output fuzzy set.

4\.  \*\*Aggregation:\*\* All active rules are combined into a single unified fuzzy set.

5\.  \*\*Defuzzification:\*\* The final "Crisp" efficiency score is calculated using the \*\*Centroid Method\*\*:

&nbsp;   $$z^\* = \\frac{\\int \\mu\_C(z) \\cdot z \\, dz}{\\int \\mu\_C(z) \\, dz}$$

