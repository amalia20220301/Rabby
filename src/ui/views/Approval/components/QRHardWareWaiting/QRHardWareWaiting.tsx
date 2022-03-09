import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Player from './Player';
import Reader from './Reader';
import { EVENTS, WALLET_BRAND_CONTENT, WALLET_BRAND_TYPES } from 'consts';
import { useTranslation } from 'react-i18next';
import { StrayPageWithButton } from 'ui/component';
import eventBus from '@/eventBus';
import { useApproval } from 'ui/utils';
import SignatureQRChecker from './SignatureQRChecker';
import { useHistory } from 'react-router-dom';

enum QRHARDWARE_STATUS {
  SYNC,
  SIGN,
}

type RequestSignPayload = {
  requestId: string;
  payload: {
    type: string;
    cbor: string;
  };
};

const QRHardWareWaiting = () => {
  const [status, setStatus] = useState<QRHARDWARE_STATUS>(
    QRHARDWARE_STATUS.SYNC
  );
  const [signPayload, setSignPayload] = useState<RequestSignPayload>();
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignText, setIsSignText] = useState(false);
  const history = useHistory();
  const init = useCallback(async () => {
    const approval = await getApproval();
    setIsSignText(approval?.approvalType !== 'SignTx');
    eventBus.addEventListener(
      EVENTS.QRHARDWARE.STATUS_CHANGED,
      ({ request }) => {
        setSignPayload(request);
      }
    );
    eventBus.addEventListener(EVENTS.SIGN_FINISHED, async (data) => {
      if (data.success) {
        resolveApproval(data.data, !isSignText);
      } else {
        rejectApproval(data.errorMsg);
      }
      history.push('/');
    });
  }, []);

  useEffect(() => {
    init();
    return () => {
      eventBus.removeAllEventListeners(EVENTS.QRHARDWARE.STATUS_CHANGED);
    };
  }, [init]);

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };
  const handleRequestSignature = () => {
    setErrorMessage('');
    setStatus(QRHARDWARE_STATUS.SIGN);
  };

  const showErrorChecker = useMemo(() => {
    return errorMessage !== '' && status == QRHARDWARE_STATUS.SIGN;
  }, [errorMessage]);

  const walletBrandContent = WALLET_BRAND_CONTENT[WALLET_BRAND_TYPES.KEYSTONE];
  return (
    <StrayPageWithButton
      hasBack
      hasDivider
      noPadding
      className="qr-hardware-sign"
      onBackClick={handleCancel}
      NextButtonContent={t('Get Signature')}
      onNextClick={handleRequestSignature}
      nextDisabled={status == QRHARDWARE_STATUS.SIGN}
    >
      <header className="create-new-header create-password-header h-[264px]">
        <img
          className="rabby-logo"
          src="/images/logo-gray.png"
          alt="rabby logo"
        />
        <img
          className="unlock-logo w-[80px] h-[75px] mb-20 mx-auto"
          src={walletBrandContent.image}
        />
        <p className="text-24 mb-4 mt-0 text-white text-center font-bold">
          {t(walletBrandContent.name)}
        </p>
        <p className="text-14 mb-0 mt-4 text-white opacity-80 text-center">
          {t('Scan the QR code on the Keystone hardware wallet')}
        </p>
        <img src="/images/watch-mask.png" className="mask" />
      </header>
      <div className="flex justify-center qrcode-scanner">
        {status === QRHARDWARE_STATUS.SYNC && signPayload && (
          <Player
            type={signPayload.payload.type}
            cbor={signPayload.payload.cbor}
          />
        )}
        {status === QRHARDWARE_STATUS.SIGN && (
          <Reader
            requestId={signPayload?.requestId}
            setErrorMessage={setErrorMessage}
          />
        )}
        {showErrorChecker && (
          <SignatureQRChecker
            visible={showErrorChecker}
            onCancel={handleCancel}
            data={errorMessage}
            onOk={handleRequestSignature}
            okText={t('Try Again')}
            cancelText={t('Cancel')}
          />
        )}
      </div>
    </StrayPageWithButton>
  );
};

export default QRHardWareWaiting;
