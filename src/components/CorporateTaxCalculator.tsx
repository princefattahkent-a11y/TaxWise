"use client";

import React, { useState, useMemo } from "react";
import { C } from "../lib/constants";
import {
  computeCorporateTax,
  CompanyRateCategory,
  AddBackItems,
  DeductionItems,
  emptyAddBacks,
  emptyDeductions,
} from "../lib/tax/corporateTax";

const formatUGX = (n: number) => {
  return "UGX " + Math.round(n).toLocaleString("en-US");
};

interface MoneyFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

const MoneyField: React.FC<MoneyFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [tempValue, setTempValue] = useState<string>(
    value === 0 ? "0" : value.toLocaleString("en-US")
  );

  if (value !== prevValue) {
    setPrevValue(value);
    setTempValue(value === 0 ? "0" : value.toLocaleString("en-US"));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.-]/g, "");
    if (rawValue === "" || rawValue === "-") {
      setTempValue(rawValue);
      onChange(0);
      return;
    }
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      setTempValue(rawValue);
      onChange(num);
    }
  };

  const handleBlur = () => {
    setTempValue(value === 0 ? "0" : value.toLocaleString("en-US"));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: C.navy, letterSpacing: "0.01em" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "monospace",
            fontSize: "13px",
            color: C.muted,
            fontWeight: 700,
          }}
        >
          UGX
        </span>
        <input
          type="text"
          value={tempValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "10px 12px 10px 44px",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: 600,
            border: `1.5px solid ${C.border}`,
            borderRadius: "8px",
            background: disabled ? "#F3F4F6" : C.offwhite,
            color: C.navy,
            outline: "none",
            boxSizing: "border-box",
            transition: "all 0.15s ease",
          }}
        />
      </div>
    </div>
  );
};

export const CorporateTaxCalculator: React.FC = () => {
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [rateCat, setRateCat] = useState<CompanyRateCategory>("standard");
  const [netProfit, setNetProfit] = useState<number>(100000000);
  const [bfLoss, setBfLoss] = useState<number>(0);

  // Simple Mode lump sums
  const [lumpAdd, setLumpAdd] = useState<number>(0);
  const [lumpDed, setLumpDed] = useState<number>(0);

  // Detailed Mode fields
  const [addBacks, setAddBacks] = useState<AddBackItems>(emptyAddBacks());
  const [deductions, setDeductions] = useState<DeductionItems>(emptyDeductions());
  const [repatProfit, setRepatProfit] = useState<number>(0);

  const result = useMemo(() => {
    if (mode === "simple") {
      return computeCorporateTax({
        netProfitBeforeTax: netProfit,
        addBacks: lumpAdd,
        deductions: lumpDed,
        netCapitalGains: 0,
        broughtForwardLoss: bfLoss,
        rateCategory: rateCat,
        repatriatedBranchProfit: 0,
      });
    } else {
      return computeCorporateTax({
        netProfitBeforeTax: netProfit,
        addBacks,
        deductions,
        netCapitalGains: 0,
        broughtForwardLoss: bfLoss,
        rateCategory: rateCat,
        repatriatedBranchProfit: repatProfit,
      });
    }
  }, [mode, rateCat, netProfit, bfLoss, lumpAdd, lumpDed, addBacks, deductions, repatProfit]);

  const updateAddBack = (key: keyof AddBackItems, val: number) => {
    setAddBacks((prev) => ({ ...prev, [key]: val }));
  };

  const updateDeduction = (key: keyof DeductionItems, val: number) => {
    setDeductions((prev) => ({ ...prev, [key]: val }));
  };

  const detailRows = useMemo(() => {
    const totalAdd = result.totalAddBacks;
    const totalDed = result.totalDeductions;

    const rows = [
      { label: "Total add-backs", value: formatUGX(totalAdd), highlight: false, danger: false },
      { label: "Total allowable deductions", value: formatUGX(totalDed), highlight: false, danger: false },
      { label: "Profit after adjustment (Schedule 1, line 4)", value: formatUGX(result.adjustedProfit), highlight: false, danger: result.adjustedProfit < 0 },
      { label: "Income chargeable before loss relief (line 7)", value: formatUGX(result.incomeChargeableBeforeLossRelief), highlight: false, danger: false },
      { label: "Brought-forward loss relieved this year", value: formatUGX(result.lossReliefUsed), highlight: false, danger: false },
      { label: "Loss carried forward to next year (line 10)", value: formatUGX(result.lossCarriedForward), highlight: result.lossCarriedForward > 0, danger: false },
      { label: "Tax rate applied", value: `${(result.taxRate * 100).toFixed(0)}%`, highlight: false, danger: false },
    ];

    if (result.branchRepatriationTax > 0) {
      rows.push({
        label: "Branch repatriation tax (15%)",
        value: formatUGX(result.branchRepatriationTax),
        highlight: false,
        danger: true,
      });
    }

    return rows;
  }, [result]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          background: C.offwhite,
          padding: "16px 20px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "inline-flex", background: "#E5E7EB", borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setMode("simple")}
            style={{
              border: "none",
              background: mode === "simple" ? C.white : "transparent",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: "13px",
              fontWeight: 700,
              color: mode === "simple" ? C.navy : C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            Simple
          </button>
          <button
            onClick={() => setMode("detailed")}
            style={{
              border: "none",
              background: mode === "detailed" ? C.white : "transparent",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: "13px",
              fontWeight: 700,
              color: mode === "detailed" ? C.navy : C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            Detailed (Schedule 1)
          </button>
        </div>

        <div style={{ minWidth: 240 }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.muted, marginBottom: 4, textTransform: "uppercase" }}>
            Tax Rate Category
          </label>
          <select
            value={rateCat}
            onChange={(e) => setRateCat(e.target.value as CompanyRateCategory)}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontFamily: "inherit",
              fontSize: "14px",
              fontWeight: 700,
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              color: C.navy,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="standard">Standard company (30%)</option>
            <option value="listed">Listed, ≥30% floated (25%)</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <MoneyField
          label="Profit / (loss) before tax per accounts"
          value={netProfit}
          onChange={setNetProfit}
        />
        <MoneyField
          label="Loss brought forward from prior year"
          value={bfLoss}
          onChange={setBfLoss}
        />
      </div>

      {mode === "simple" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MoneyField
            label="Total add-backs (depreciation, disallowed expenses, etc.)"
            value={lumpAdd}
            onChange={setLumpAdd}
          />
          <MoneyField
            label="Total allowable deductions (capital allowances, etc.)"
            value={lumpDed}
            onChange={setLumpDed}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ADD-BACKS GROUP */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: C.gold, fontWeight: 800, margin: "10px 0 0 0" }}>
              Add: disallowed items (Schedule 1, item 2)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              <MoneyField
                label="Depreciation"
                value={addBacks.depreciation}
                onChange={(v) => updateAddBack("depreciation", v)}
              />
              <MoneyField
                label="Entertainment (disallowed)"
                value={addBacks.entertainmentDisallowed}
                onChange={(v) => updateAddBack("entertainmentDisallowed", v)}
              />
              <MoneyField
                label="Exempt-income expenses"
                value={addBacks.expensesRelatedToExemptIncome}
                onChange={(v) => updateAddBack("expensesRelatedToExemptIncome", v)}
              />
              <MoneyField
                label="Loss on disposal of assets"
                value={addBacks.lossOnDisposalOfAssets}
                onChange={(v) => updateAddBack("lossOnDisposalOfAssets", v)}
              />
              <MoneyField
                label="Balancing charge"
                value={addBacks.balancingCharge}
                onChange={(v) => updateAddBack("balancingCharge", v)}
              />
              <MoneyField
                label="Donations (disallowed)"
                value={addBacks.donationsDisallowed}
                onChange={(v) => updateAddBack("donationsDisallowed", v)}
              />
              <MoneyField
                label="Bad debt provision (debited)"
                value={addBacks.provisionForBadDebts}
                onChange={(v) => updateAddBack("provisionForBadDebts", v)}
              />
              <MoneyField
                label="Start-up / pre-op costs"
                value={addBacks.startupCosts}
                onChange={(v) => updateAddBack("startupCosts", v)}
              />
              <MoneyField
                label="Unrealized forex loss"
                value={addBacks.unrealizedForexLoss}
                onChange={(v) => updateAddBack("unrealizedForexLoss", v)}
              />
              <MoneyField
                label="Other non-allowable"
                value={addBacks.otherDisallowable}
                onChange={(v) => updateAddBack("otherDisallowable", v)}
              />
            </div>
          </div>

          {/* DEDUCTIONS GROUP */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: C.teal, fontWeight: 800, margin: "10px 0 0 0" }}>
              Less: allowable items (Schedule 1, item 3)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              <MoneyField
                label="Exempt income (in P&L)"
                value={deductions.exemptIncome}
                onChange={(v) => updateDeduction("exemptIncome", v)}
              />
              <MoneyField
                label="Gross rental income"
                value={deductions.grossRentalIncome}
                onChange={(v) => updateDeduction("grossRentalIncome", v)}
              />
              <MoneyField
                label="Profit on disposal of assets"
                value={deductions.profitOnDisposalOfAssets}
                onChange={(v) => updateDeduction("profitOnDisposalOfAssets", v)}
              />
              <MoneyField
                label="Capital allowance (Sch. 2)"
                value={deductions.capitalAllowance}
                onChange={(v) => updateDeduction("capitalAllowance", v)}
              />
              <MoneyField
                label="Scientific research (capitalized)"
                value={deductions.scientificResearchCapitalized}
                onChange={(v) => updateDeduction("scientificResearchCapitalized", v)}
              />
              <MoneyField
                label="Unrealized forex gain"
                value={deductions.unrealizedForexGain}
                onChange={(v) => updateDeduction("unrealizedForexGain", v)}
              />
              <MoneyField
                label="Bad debt provision (credited)"
                value={deductions.provisionForBadDebtsCredited}
                onChange={(v) => updateDeduction("provisionForBadDebtsCredited", v)}
              />
              <MoneyField
                label="Income taxed as final WHT"
                value={deductions.finalWithholdingTaxIncome}
                onChange={(v) => updateDeduction("finalWithholdingTaxIncome", v)}
              />
              <MoneyField
                label="Other allowable deductions"
                value={deductions.otherAllowable}
                onChange={(v) => updateDeduction("otherAllowable", v)}
              />
            </div>
          </div>

          {/* BRANCH REPATRIATION */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: `1px dashed ${C.border}`, paddingTop: 16 }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: C.navy, fontWeight: 800 }}>
              Branch profit repatriation (non-resident branches only)
            </h3>
            <div style={{ maxWidth: 320 }}>
              <MoneyField
                label="Repatriated profit (taxed separately at 15%)"
                value={repatProfit}
                onChange={setRepatProfit}
              />
            </div>
          </div>
        </div>
      )}

      {/* RESULTS SECTIONS */}
      <div style={{ marginTop: 12, borderTop: `2px dashed ${C.border}`, paddingTop: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: C.muted, letterSpacing: "0.05em", marginBottom: 6 }}>
              Chargeable Business Income
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 800, color: C.navy }}>
              {formatUGX(result.chargeableBusinessIncome)}
            </div>
          </div>

          <div style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}30`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: C.gold, letterSpacing: "0.05em", marginBottom: 6 }}>
              Income Tax Payable
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 800, color: C.gold }}>
              {formatUGX(result.incomeTax)}
            </div>
          </div>

          <div style={{ background: `${C.teal}12`, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: C.teal, letterSpacing: "0.05em", marginBottom: 6 }}>
              Total Tax Payable
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 800, color: C.teal }}>
              {formatUGX(result.totalTaxPayable)}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", marginBottom: 20 }}>
          <tbody>
            {detailRows.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: row.highlight ? `${C.gold}12` : "transparent",
                }}
              >
                <td style={{ padding: "10px 12px", color: C.muted, fontWeight: 500 }}>{row.label}</td>
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: row.danger ? C.red : row.highlight ? C.gold : C.navy,
                  }}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            fontSize: "12px",
            color: C.muted,
            lineHeight: "1.6",
            padding: "16px",
            background: C.offwhite,
            borderLeft: `4px solid ${C.gold}`,
            borderRadius: "4px",
          }}
        >
          Modeled on URA Form DT-2002, Schedule 1 (Computation of income from business and profession) and Section C. Standard rate is 30%; a reduced 25% applies to companies listed on the Uganda Securities Exchange with at least 30% of shares floated. Repatriated branch profit is taxed separately at 15%, in addition to the tax on the branch&apos;s own chargeable income. Capital allowances (initial allowance, wear-and-tear, industrial building allowance) should be computed on Schedule 2 and entered here as a single total — this calculator does not itself maintain a fixed-asset register.
        </div>
      </div>
    </div>
  );
};
