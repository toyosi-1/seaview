'use client'

import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { nairaToWords } from '@/lib/utils/numberToWords'
import { formatOrdinalDate } from '@/lib/utils/format'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    paddingTop: 40,
    paddingBottom: 70,
    paddingHorizontal: 55,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 70,
    height: 70,
    marginBottom: 6,
    objectFit: 'contain',
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
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
    marginTop: 8,
    marginBottom: 20,
  },
  refDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  refDateText: {
    fontSize: 10,
  },
  addressBlock: {
    marginBottom: 14,
  },
  addressLine: {
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  salutation: {
    fontSize: 10.5,
    marginBottom: 12,
  },
  subject: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  noticeTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  boldInline: {
    fontFamily: 'Helvetica-Bold',
  },
  closing: {
    fontSize: 10.5,
    marginTop: 16,
    marginBottom: 4,
  },
  sigImageWrap: {
    height: 46,
    marginBottom: 2,
    justifyContent: 'flex-end',
  },
  sigImage: {
    width: 110,
    height: 42,
    objectFit: 'contain',
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
  contractValue: number
  awardDate: string
  bidDate?: string
  completionPeriod?: string
  mdName?: string
  mdSignatureUrl?: string
}

const VAT_RATE = 7.5
const STAMP_DUTY_RATE = 1

const logoSrc = typeof window !== 'undefined'
  ? `${window.location.origin}/brand/spl-logo-full.png`
  : '/brand/spl-logo-full.png'

const npaLogoSrc = typeof window !== 'undefined'
  ? `${window.location.origin}/brand/npa-logo-full.png`
  : '/brand/npa-logo-full.png'

function AwardLetterDoc({ data }: { data: AwardLetterData }) {
  const formattedValue = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(data.contractValue)

  const valueInWords = nairaToWords(data.contractValue)
  const completionPeriod = data.completionPeriod?.trim() || 'a period to be agreed with the Head, Environment'

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
          <Text style={styles.orgSub}>E-mail: Seaviewpropertiesltd@gmail.com  www.Seaviewpropertiesltd.com.ng</Text>
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
          {(data.contractorAddress ?? '').split(',').filter(Boolean).map((line, i) => (
            <Text key={i} style={styles.addressLine}>{line.trim()},</Text>
          ))}
          {data.contractorPhone && <Text style={styles.addressLine}>{data.contractorPhone}.</Text>}
        </View>

        <Text style={styles.salutation}>Dear Sir,</Text>

        <Text style={styles.subject}>CONTRACT FOR {data.contractTitle.toUpperCase()}</Text>
        <Text style={styles.noticeTitle}>NOTIFICATION OF AWARD</Text>

        <Text style={styles.bodyText}>
          This is to convey the Management of Seaview Properties Limited approval of {formatOrdinalDate(data.awardDate)} in respect of your bid{data.bidDate ? ` dated ${formatOrdinalDate(data.bidDate)}` : ''} for the {data.contractTitle} at a contract sum of {formattedValue} ({valueInWords}) inclusive of {VAT_RATE}% VAT, with a completion period of {completionPeriod} from the date of acceptance of this offer.
        </Text>

        <Text style={styles.bodyText}>
          Upon acceptance of this offer, you are required to contact the Head, Legal Services for signing of the Contract Agreement. <Text style={styles.boldInline}>Note that {STAMP_DUTY_RATE}% shall be deducted from the total contract sum as stamp duty to be paid to FIRS.</Text>
        </Text>

        <Text style={styles.bodyText}>
          The work shall be executed in accordance with the given specification as detailed in the tender document (copy attached). In this regard, you are required to contact the Head, Environment who will nominate an officer to supervise the Job. The representatives of Procurement, Audit and Environment Departments shall witness the completion of the Job.
        </Text>

        <Text style={styles.bodyText}>
          Payment of the Contract sum shall be made upon satisfactory performance and upon certification by the Head Procurement, Audit and Environment Departments.
        </Text>

        <Text style={styles.bodyText}>
          Please note that there shall be no cost escalation on this contract.
        </Text>

        <Text style={styles.bodyText}>
          Kindly indicate your acceptance of this offer or otherwise within Seven (7) days of the receipt of this letter after which the offer shall lapse.
        </Text>

        <Text style={styles.closing}>Yours faithfully,</Text>

        <View style={styles.sigImageWrap}>
          {data.mdSignatureUrl && (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.mdSignatureUrl} style={styles.sigImage} />
            </>
          )}
        </View>
        <Text style={styles.sigTitle}>Managing Director</Text>
        <Text style={styles.sigTitle}>For: Seaview Properties Limited</Text>

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
