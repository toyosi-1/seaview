'use client'

import { Document, Page, Text, View, StyleSheet, Image, Font, pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { nairaToWords } from '@/lib/utils/numberToWords'
import { formatOrdinalDate } from '@/lib/utils/format'

// Helvetica (the PDF default font) has no glyph for the Naira sign (₦),
// so it renders as a broken/garbled character. Noto Sans includes it.
const fontsBaseUrl = typeof window !== 'undefined' ? window.location.origin : ''
Font.register({
  family: 'NotoSans',
  fonts: [
    { src: `${fontsBaseUrl}/fonts/NotoSans-Regular.ttf`, fontWeight: 'normal' },
    { src: `${fontsBaseUrl}/fonts/NotoSans-Bold.ttf`, fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 68,
    paddingHorizontal: 55,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 56,
    height: 56,
    marginBottom: 4,
    objectFit: 'contain',
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  rcNumber: {
    fontSize: 7,
    color: '#64748b',
    marginLeft: 4,
    marginBottom: 3,
  },
  orgSub: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },
  headerRule: {
    borderBottom: '2px solid #1a1a2e',
    marginTop: 7,
    marginBottom: 14,
  },
  refDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  refDateText: {
    fontSize: 10,
  },
  addressBlock: {
    marginBottom: 10,
  },
  addressLine: {
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  salutation: {
    fontSize: 10,
    marginBottom: 9,
  },
  subject: {
    fontSize: 10.5,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  noticeTitle: {
    fontSize: 10.5,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 9.5,
    lineHeight: 1.4,
    marginBottom: 7,
    textAlign: 'justify',
  },
  boldInline: {
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
  },
  signatureBlock: {
    marginTop: 6,
  },
  closing: {
    fontSize: 10,
    marginBottom: 3,
  },
  sigImageWrap: {
    width: 155,
    height: 54,
    marginBottom: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sigImage: {
    width: 155,
    height: 52,
    objectFit: 'contain',
    objectPosition: 'left center',
  },
  sigName: {
    fontSize: 10.5,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 1,
    marginBottom: 1,
  },
  sigTitle: {
    fontSize: 10,
    color: '#1a1a2e',
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 50,
    right: 50,
    alignItems: 'center',
  },
  footerLogo: {
    width: 32,
    height: 32,
    marginBottom: 4,
    objectFit: 'contain',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLine: {
    width: 55,
    borderBottom: '0.75px solid #94a3b8',
  },
  footerText: {
    fontSize: 8,
    color: '#475569',
    marginHorizontal: 8,
  },
})

interface AwardLetterData {
  contractNumber: string
  proposalNumber: string
  contractorName: string
  contractorAddress?: string
  contractorPhone?: string
  contractTitle: string
  contractDescription: string
  contractValue: number
  awardDate: string
  bidDate?: string
  completionPeriod?: string
  mdName?: string
  mdSignatureUrl?: string
  responsibleDepartment?: string
}

const VAT_RATE = 7.5
const STAMP_DUTY_RATE = 1

const logoSrc = typeof window !== 'undefined'
  ? `${window.location.origin}/brand/spl-logo-full-optimized.png`
  : '/brand/spl-logo-full-optimized.png'

const npaLogoSrc = typeof window !== 'undefined'
  ? `${window.location.origin}/brand/npa-logo-full-optimized.png`
  : '/brand/npa-logo-full-optimized.png'

function formatDepartmentList(department: string): string {
  const base = ['Procurement', 'Audit']
  const departments = base.includes(department) ? base : [...base, department]
  if (departments.length === 2) return departments.join(' and ')
  return `${departments.slice(0, -1).join(', ')} and ${departments[departments.length - 1]}`
}

function cleanText(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function completionWording(completionPeriod: string | undefined, department: string): string {
  const period = cleanText(completionPeriod)
    .replace(/[.;,]+$/, '')
    .replace(/,?\s*(?:commencing\s+)?from the date of acceptance of this offer$/i, '')
  if (!period) {
    return `with a completion period to be agreed with the Head, ${department}, commencing from the date of acceptance of this offer`
  }
  if (/^(a period |a completion period )/i.test(period)) {
    return `with ${period}, commencing from the date of acceptance of this offer`
  }
  if (/^to be agreed/i.test(period)) {
    return `with a completion period ${period}, commencing from the date of acceptance of this offer`
  }
  return `with a completion period of ${period}, commencing from the date of acceptance of this offer`
}

function validateAwardLetterData(data: AwardLetterData): void {
  const missing = [
    ['contract reference number', data.contractNumber],
    ['contractor name', data.contractorName],
    ['contract title', data.contractTitle],
    ['contract description', data.contractDescription],
    ['award date', data.awardDate],
    ['responsible department', data.responsibleDepartment],
    ['authorized signatory', data.mdName],
  ].filter(([, value]) => !cleanText(value as string | undefined)).map(([label]) => label)

  if (!Number.isFinite(data.contractValue) || data.contractValue <= 0) missing.push('contract amount')
  if (missing.length > 0) throw new Error(`Cannot generate award letter: missing or invalid ${missing.join(', ')}.`)
  if (Number.isNaN(new Date(data.awardDate).getTime())) throw new Error('Cannot generate award letter: invalid award date.')
  if (data.bidDate && Number.isNaN(new Date(data.bidDate).getTime())) throw new Error('Cannot generate award letter: invalid bid date.')
}

function AwardLetterDoc({ data }: { data: AwardLetterData }) {
  validateAwardLetterData(data)
  const formattedValue = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(data.contractValue)

  const valueInWords = nairaToWords(data.contractValue)
  const department = cleanText(data.responsibleDepartment)
  const departmentList = formatDepartmentList(department)
  const completionClause = completionWording(data.completionPeriod, department)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header / Letterhead */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={styles.logoImage} src={logoSrc} />
          <View style={styles.orgNameRow}>
            <Text style={styles.orgName}>Seaview Properties Limited</Text>
            <Text style={styles.rcNumber}>RC: 188520</Text>
          </View>
          <Text style={styles.orgSub}>1, Joseph Street, (Off Marina) Lagos. Tel: 09090527529</Text>
          <Text style={styles.orgSub}>E-mail: Seaviewpropertiesltd@gmail.com  |  www.Seaviewpropertiesltd.com.ng</Text>
        </View>
        <View style={styles.headerRule} />

        {/* Ref / Date */}
        <View style={styles.refDateRow}>
          <Text style={styles.refDateText}>Ref: {data.contractNumber}</Text>
          <Text style={styles.refDateText}>{formatOrdinalDate(data.awardDate)}</Text>
        </View>

        {/* Addressee */}
        <View style={styles.addressBlock}>
          <Text style={styles.addressLine}>The Managing Director,</Text>
          <Text style={styles.addressLine}>Messrs. {data.contractorName},</Text>
          {cleanText(data.contractorAddress) && (
            <Text style={styles.addressLine}>{cleanText(data.contractorAddress).replace(/[,.]+$/, '')},</Text>
          )}
          {data.contractorPhone && <Text style={styles.addressLine}>{cleanText(data.contractorPhone).replace(/[.]+$/, '')}.</Text>}
        </View>

        <Text style={styles.salutation}>Dear Sir,</Text>

        <Text style={styles.subject}>CONTRACT FOR {data.contractTitle.toUpperCase()}</Text>
        <Text style={styles.noticeTitle}>NOTIFICATION OF AWARD</Text>

        <Text style={styles.bodyText}>
          We are pleased to convey the approval granted by the Management of Seaview Properties Limited on {formatOrdinalDate(data.awardDate)} in respect of your bid{data.bidDate ? ` dated ${formatOrdinalDate(data.bidDate)}` : ''} for the execution of {cleanText(data.contractDescription)}, at a contract sum of {formattedValue} ({valueInWords}), inclusive of {VAT_RATE}% VAT, {completionClause}.
        </Text>

        <Text style={styles.bodyText}>
          Upon acceptance of this offer, you are required to contact the Head, Legal Services, to execute the Contract Agreement. <Text style={styles.boldInline}>Please note that {STAMP_DUTY_RATE}% shall be deducted from the total contract sum as stamp duty payable to FIRS.</Text>
        </Text>

        <Text style={styles.bodyText}>
          The work shall be executed in accordance with the specifications detailed in the tender document (copy attached). Accordingly, you are required to contact the Head, {department}, who will nominate an officer to supervise the work. Representatives of the {departmentList} Departments shall witness the completion of the work.
        </Text>

        <Text style={styles.bodyText}>
          Payment of the contract sum shall be made upon satisfactory performance and certification by the Heads of the {departmentList} Departments.
        </Text>

        <Text style={styles.bodyText}>
          Please note that no cost escalation shall apply to this contract.
        </Text>

        <Text style={styles.bodyText}>
          Kindly communicate whether you accept this offer within seven (7) days of receipt of this letter, failing which the offer shall lapse.
        </Text>

        <View style={styles.signatureBlock} wrap={false}>
          <Text style={styles.closing}>Yours faithfully,</Text>
          <View style={styles.sigImageWrap}>
            {data.mdSignatureUrl && (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={data.mdSignatureUrl} style={styles.sigImage} />
              </>
            )}
          </View>
          <Text style={styles.sigName}>{data.mdName}</Text>
          <Text style={styles.sigTitle}>Managing Director</Text>
          <Text style={styles.sigTitle}>For: Seaview Properties Limited</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={styles.footerLogo} src={npaLogoSrc} />
          <View style={styles.footerRow}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>(A Subsidiary of Nigerian Ports Authority)</Text>
            <View style={styles.footerLine} />
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function downloadAwardLetter(data: AwardLetterData) {
  const blob = await pdf(<AwardLetterDoc data={data} />).toBlob()
  saveAs(blob, `Award-Letter-${data.contractNumber}.pdf`)
}

export { AwardLetterDoc }
