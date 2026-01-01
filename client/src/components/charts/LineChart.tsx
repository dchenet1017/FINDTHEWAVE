import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export interface LineChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface LineChartProps {
  data: LineChartData[]
  dataKey: string
  strokeColor?: string
  title?: string
  height?: number
}

export function LineChart({
  data,
  dataKey,
  strokeColor = '#6C5CE7',
  title,
  height = 300,
}: LineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-700 bg-dark-card p-3 shadow-lg">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-dark-card p-6">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="#B0B0B0"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#B0B0B0"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#B0B0B0', fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={{ fill: strokeColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

