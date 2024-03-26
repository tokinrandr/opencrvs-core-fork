/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import {
  Box,
  Button,
  Frame,
  Stack,
  Content,
  Icon,
  ResponsiveModal,
  AppBar,
  Spinner
} from '@opencrvs/components'
import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useParams } from 'react-router'
import { messages as certificateMessages } from '@client/i18n/messages/views/certificate'
import { useIntl } from 'react-intl'
import { buttonMessages } from '@client/i18n/messages/buttons'
import { goToHomeTab, goBack } from '@client/navigation'
import { useModal } from '@client/hooks/useModal'

import { WORKQUEUE_TABS } from '@client/components/interface/Navigation'
import styled from 'styled-components'
import { constantsMessages } from '@client/i18n/messages'
import { usePrintableCertificate } from './usePrintableCertificate'
import { createPDF } from '@client/pdfRenderer'

const CertificateContainer = styled.div``

const ReviewCertificateFrame = ({
  children,
  iframeRef
}: {
  children: React.ReactNode
  iframeRef?: React.MutableRefObject<HTMLIFrameElement | null>
}) => {
  const intl = useIntl()
  const dispatch = useDispatch()
  const location = useLocation<{ isNavigatedInsideApp: boolean }>()

  const back = () => {
    const historyState = location.state
    const navigatedFromInsideApp = Boolean(
      historyState && historyState.isNavigatedInsideApp
    )

    if (navigatedFromInsideApp) {
      dispatch(goBack())
    } else {
      dispatch(goToHomeTab(WORKQUEUE_TABS.readyToPrint))
    }
  }

  return (
    <Frame
      header={
        <AppBar
          desktopTitle={intl.formatMessage(
            certificateMessages.certificateCollectionTitle
          )}
          desktopLeft={
            <Button type="icon" onClick={back}>
              <Icon name="ArrowLeft" size="large" />
            </Button>
          }
          desktopRight={
            <Stack>
              <Button
                type="primary"
                onClick={() => iframeRef?.current?.contentWindow?.print()}
              >
                Continue
              </Button>
              {/* <Button
                type="icon"
                onClick={() =>
                  dispatch(goToHomeTab(WORKQUEUE_TABS.readyToPrint))
                }
              >
                <Icon name="X" size="large" />
              </Button> */}
            </Stack>
          }
        />
      }
      skipToContentText={intl.formatMessage(
        constantsMessages.skipToMainContent
      )}
    >
      {children}
    </Frame>
  )
}

export const ReviewCertificate = () => {
  const { registrationId } = useParams<{ registrationId: string }>()
  const {
    svg,
    loading,
    handleCertify,
    isPrintInAdvanced,
    canUserEditRecord,
    handleEdit,
    dataUrl
  } = usePrintableCertificate(registrationId)
  const intl = useIntl()
  const [modal, openModal] = useModal()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const howTo = useCallback(async () => {
    const confirmHowTo = await openModal<'back' | 'ok'>((close) => (
      <ResponsiveModal
        id="confirm-print-modal"
        title="Review certificate preview"
        actions={[
          <Button
            type="tertiary"
            key="close-modal"
            onClick={() => {
              close('back')
            }}
            id="close-modal"
          >
            Cancel
          </Button>,
          <Button
            type="primary"
            key="print-certificate"
            onClick={() => close('ok')}
            id="print-certificate"
          >
            OK
          </Button>
        ]}
        show={true}
        handleClose={() => close(null)}
        contentHeight={100}
      >
        Please review the certificate with the collector and confirm that the
        details are correct.
      </ResponsiveModal>
    ))

    if (confirmHowTo) {
    }
  }, [openModal])

  useEffect(() => {
    howTo()
  }, [howTo])

  if (loading) {
    return (
      <ReviewCertificateFrame>
        <Frame.LayoutCentered>
          <Spinner id="review-certificate-loading" />
        </Frame.LayoutCentered>
      </ReviewCertificateFrame>
    )
  }

  const confirmAndPrint = async () => {
    const saveAndExitConfirm = await openModal<boolean | null>((close) => (
      <ResponsiveModal
        id="confirm-print-modal"
        title={
          isPrintInAdvanced
            ? intl.formatMessage(certificateMessages.printModalTitle)
            : intl.formatMessage(certificateMessages.printAndIssueModalTitle)
        }
        actions={[
          <Button
            type="tertiary"
            key="close-modal"
            onClick={() => {
              close(null)
            }}
            id="close-modal"
          >
            {intl.formatMessage(buttonMessages.cancel)}
          </Button>,
          <Button
            type="primary"
            key="print-certificate"
            onClick={handleCertify}
            id="print-certificate"
          >
            {intl.formatMessage(buttonMessages.print)}
          </Button>
        ]}
        show={true}
        handleClose={() => close(null)}
        contentHeight={100}
      >
        {isPrintInAdvanced
          ? intl.formatMessage(certificateMessages.printModalBody)
          : intl.formatMessage(certificateMessages.printAndIssueModalBody)}
      </ResponsiveModal>
    ))

    if (saveAndExitConfirm) {
      handleCertify()
    }
  }

  return (
    <ReviewCertificateFrame iframeRef={iframeRef}>
      <iframe
        ref={iframeRef}
        src={dataUrl}
        title="PDF Preview"
        style={{ width: '100%', height: '100%', border: 0 }}
      />
      {modal}
    </ReviewCertificateFrame>
  )
}
