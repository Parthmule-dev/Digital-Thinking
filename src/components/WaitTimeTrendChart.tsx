import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart
} from "recharts";
import { Clock, TrendingUp, TrendingDown, Users, ShieldAlert, Sparkles } from "lucide-react";
import { Patient } from "../types";

export interface HourlyWaitTimeData {
  timeLabel: string;
  hourDisplay: string;
  avgWaitMinutes: number;
  patientVolume: number;
  emergencyCount: number;
  staffOnDuty: number;
  targetMinutes: number;
}

interface WaitTimeTrendChartProps {
  currentPatients: Patient[];
  currentAvgWait: number;
}

export const WaitTimeTrendChart: React.FC<WaitTimeTrendChartProps> = ({
  currentPatients,
  currentAvgWait,
}) => {
  // Generate the last 6 hours trend data ending at the current operational hour
  // Blending realistic hospital intake history with real-time active patient queue
  const waitingCount = currentPatients.filter((p) => p.status === "waiting").length;
  const inConsultCount = currentPatients.filter((p) => p.status === "in_consultation").length;
  const currentHourPatients = waitingCount + inConsultCount;
  const currentEmergency = currentPatients.filter(
    (p) => p.urgency === "Emergency" && p.status !== "completed"
  ).length;

  const trendData: HourlyWaitTimeData[] = [
    {
      timeLabel: "04:00 AM",
      hourDisplay: "-5h (04:00)",
      avgWaitMinutes: 8,
      patientVolume: 3,
      emergencyCount: 0,
      staffOnDuty: 2,
      targetMinutes: 15,
    },
    {
      timeLabel: "05:00 AM",
      hourDisplay: "-4h (05:00)",
      avgWaitMinutes: 11,
      patientVolume: 5,
      emergencyCount: 1,
      staffOnDuty: 2,
      targetMinutes: 15,
    },
    {
      timeLabel: "06:00 AM",
      hourDisplay: "-3h (06:00)",
      avgWaitMinutes: 14,
      patientVolume: 7,
      emergencyCount: 1,
      staffOnDuty: 3,
      targetMinutes: 15,
    },
    {
      timeLabel: "07:00 AM",
      hourDisplay: "-2h (07:00)",
      avgWaitMinutes: 19,
      patientVolume: 12,
      emergencyCount: 2,
      staffOnDuty: 3,
      targetMinutes: 15,
    },
    {
      timeLabel: "08:00 AM",
      hourDisplay: "-1h (08:00)",
      avgWaitMinutes: 24,
      patientVolume: 16,
      emergencyCount: 2,
      staffOnDuty: 4,
      targetMinutes: 15,
    },
    {
      timeLabel: "09:00 AM (Now)",
      hourDisplay: "Current",
      avgWaitMinutes: currentAvgWait > 0 ? currentAvgWait : 16,
      patientVolume: Math.max(currentHourPatients, 8),
      emergencyCount: currentEmergency,
      staffOnDuty: 4,
      targetMinutes: 15,
    },
  ];

  // Calculate metrics for resource allocation decisions
  const currentTrendPoint = trendData[trendData.length - 1];
  const previousTrendPoint = trendData[trendData.length - 2];
  const waitDiff = currentTrendPoint.avgWaitMinutes - previousTrendPoint.avgWaitMinutes;
  const isWaitDecreasing = waitDiff < 0;

  const peakPoint = [...trendData].sort((a, b) => b.avgWaitMinutes - a.avgWaitMinutes)[0];
  const overallAvg = Math.round(
    trendData.reduce((acc, curr) => acc + curr.avgWaitMinutes, 0) / trendData.length
  );

  // Resource allocation recommendation logic
  const getResourceAdvice = () => {
    if (currentTrendPoint.avgWaitMinutes > 20) {
      return {
        level: "critical",
        badge: "Understaffing Detected",
        color: "text-rose-700 bg-rose-50 border-rose-200",
        message:
          "Wait times exceeded 20m threshold during peak influx. Recommendation: Deploy +1 Triage Nurse to Acute Intake and open Room 104.",
      };
    }
    if (currentTrendPoint.avgWaitMinutes > 15) {
      return {
        level: "warning",
        badge: "Elevated Wait Times",
        color: "text-amber-800 bg-amber-50 border-amber-200",
        message:
          "Wait time near operational target (15m). Recommendation: Pre-stage Room 102/103 for fast-track consultations.",
      };
    }
    return {
      level: "optimal",
      badge: "Optimal Resource Match",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      message:
        "Staffing ratio matches patient demand well. Current capacity supports scheduled appointments without bottleneck.",
    };
  };

  const advice = getResourceAdvice();

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: HourlyWaitTimeData = payload[0].payload;
      const isAboveTarget = data.avgWaitMinutes > data.targetMinutes;

      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[180px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-bold text-slate-200">{label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                isAboveTarget ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isAboveTarget ? "Above Target" : "Within Target"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span>Avg Wait Time:</span>
              <span className="font-extrabold text-sky-400 text-sm">
                {data.avgWaitMinutes} mins
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Target Standard:</span>
              <span>{data.targetMinutes} mins</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Patient Inflow:</span>
              <span className="text-slate-200 font-semibold">{data.patientVolume} patients</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Active Duty Staff:</span>
              <span className="text-slate-200 font-semibold">{data.staffOnDuty} clinicians</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
      {/* Header & Metric Highlight */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              6-Hour Queue Analytics
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
              Rolling 6H Window
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Average Patient Wait Time Trend
          </h3>
          <p className="text-xs text-slate-500">
            Assisting triage desk & room supervisors with dynamic clinical staff allocation
          </p>
        </div>

        {/* Quick KPI stats pill group */}
        <div className="flex items-center gap-2 sm:self-center">
          <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200/80 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              6-Hr Average
            </span>
            <span className="text-sm font-black text-slate-800">{overallAvg}m</span>
          </div>

          <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200/80 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Peak Wait
            </span>
            <span className="text-sm font-black text-rose-600">{peakPoint.avgWaitMinutes}m</span>
          </div>

          <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200/80 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Trend Delta
            </span>
            <span
              className={`text-sm font-black flex items-center gap-0.5 ${
                isWaitDecreasing ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isWaitDecreasing ? (
                <TrendingDown className="w-3.5 h-3.5 inline" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 inline" />
              )}
              {waitDiff > 0 ? `+${waitDiff}m` : `${waitDiff}m`}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="waitTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}m`}
              domain={[0, (dataMax: number) => Math.max(dataMax + 5, 30)]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Target 15-minute wait threshold benchmark line */}
            <ReferenceLine
              y={15}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Target 15m Threshold",
                position: "insideTopRight",
                fill: "#d97706",
                fontSize: 10,
                fontWeight: "bold",
              }}
            />

            {/* Soft gradient area fill */}
            <Area
              type="monotone"
              dataKey="avgWaitMinutes"
              stroke="none"
              fill="url(#waitTimeGradient)"
            />

            {/* Main Trend Line */}
            <Line
              type="monotone"
              dataKey="avgWaitMinutes"
              name="Avg Wait Time"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ fill: "#0284c7", stroke: "#ffffff", strokeWidth: 2, r: 4 }}
              activeDot={{ fill: "#0369a1", stroke: "#ffffff", strokeWidth: 3, r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Resource Allocation Recommendation Banner */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${advice.color}`}>
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-white/70 shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                Resource Allocation Advisory
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/80 border border-current">
                {advice.badge}
              </span>
            </div>
            <p className="text-xs font-medium mt-0.5 opacity-90">{advice.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 shrink-0 self-end sm:self-center bg-white/60 px-3 py-1.5 rounded-xl border border-slate-200/50">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Active Staff: 4 Doctors • 4 Suites</span>
        </div>
      </div>
    </div>
  );
};
