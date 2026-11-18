import { useState } from 'react'
import { Flex, Typography } from 'antd'
import type { Locale } from '../i18n/types'
import { useI18n } from '../i18n/useI18n'
import type { Currency, SeriesPoint } from '../types/api'
import { formatMoney } from '../utils/format'

const { Text } = Typography

const WIDTH = 720
const HEIGHT = 240
const PAD_LEFT = 56
const PAD_RIGHT = 8
const PAD_TOP = 12
const PAD_BOTTOM = 28

export const INCOME_COLOR = '#047857'
export const EXPENSE_COLOR = '#d4380d'

interface CashFlowChartProps {
  points: SeriesPoint[]
  currency: Currency
  locale: Locale
}

export function CashFlowChart({
  points,
  currency,
  locale,
}: CashFlowChartProps) {
  const { t } = useI18n()
  const [active, setActive] = useState<number | null>(null)

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const groupWidth = plotWidth / points.length
  const barWidth = Math.max(3, groupWidth / 2 - 2)

  const max = Math.max(
    1,
    ...points.map((point) =>
      Math.max(Number(point.incoming), Number(point.outgoing)),
    ),
  )

  const dayLabel = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))

  const axisLabel = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)

  const scale = (value: string) => (Number(value) / max) * plotHeight
  const activePoint = active === null ? null : points[active]

  return (
    <div>
      <Flex
        wrap
        gap={16}
        justify="space-between"
        align="center"
        style={{ marginBottom: 8 }}
      >
        <Flex gap={16} align="center">
          <Flex gap={6} align="center">
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: INCOME_COLOR,
                display: 'inline-block',
              }}
            />
            <Text type="secondary">{t('dashboard.incoming')}</Text>
          </Flex>
          <Flex gap={6} align="center">
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: EXPENSE_COLOR,
                display: 'inline-block',
              }}
            />
            <Text type="secondary">{t('dashboard.outgoing')}</Text>
          </Flex>
        </Flex>
        <Text aria-live="polite" style={{ minHeight: 22 }}>
          {activePoint
            ? `${dayLabel(activePoint.date)} · ${t('dashboard.incoming')} ${formatMoney(
                activePoint.incoming,
                currency,
                locale,
              )} · ${t('dashboard.outgoing')} ${formatMoney(
                activePoint.outgoing,
                currency,
                locale,
              )}`
            : t('dashboard.chartHint')}
        </Text>
      </Flex>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={t('dashboard.chartLabel', { currency })}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = PAD_TOP + plotHeight - fraction * plotHeight
          return (
            <g key={fraction}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#475569"
              >
                {axisLabel(max * fraction)}
              </text>
            </g>
          )
        })}

        {points.map((point, index) => {
          const x = PAD_LEFT + index * groupWidth
          const incomingHeight = scale(point.incoming)
          const outgoingHeight = scale(point.outgoing)
          const isActive = active === index

          return (
            <g key={point.date}>
              {isActive ? (
                <rect
                  x={x}
                  y={PAD_TOP}
                  width={groupWidth}
                  height={plotHeight}
                  fill="rgba(15, 23, 42, 0.06)"
                />
              ) : null}
              <rect
                x={x + 1}
                y={PAD_TOP + plotHeight - incomingHeight}
                width={barWidth}
                height={Math.max(
                  incomingHeight,
                  point.incoming !== '0.00' ? 2 : 0,
                )}
                rx={2}
                fill={INCOME_COLOR}
              />
              <rect
                x={x + 1 + barWidth + 2}
                y={PAD_TOP + plotHeight - outgoingHeight}
                width={barWidth}
                height={Math.max(
                  outgoingHeight,
                  point.outgoing !== '0.00' ? 2 : 0,
                )}
                rx={2}
                fill={EXPENSE_COLOR}
              />
              {index % 5 === 0 ? (
                <text
                  x={x + groupWidth / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#475569"
                >
                  {dayLabel(point.date)}
                </text>
              ) : null}
              <rect
                x={x}
                y={PAD_TOP}
                width={groupWidth}
                height={plotHeight}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${dayLabel(point.date)}: ${t('dashboard.incoming')} ${formatMoney(
                  point.incoming,
                  currency,
                  locale,
                )}, ${t('dashboard.outgoing')} ${formatMoney(point.outgoing, currency, locale)}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
                style={{ outline: 'none', cursor: 'crosshair' }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
