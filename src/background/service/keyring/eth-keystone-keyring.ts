import { MetaMaskKeyring } from '@keystonehq/metamask-airgapped-keyring';
import { toChecksumAddress } from 'ethereumjs-util';
import eventBus from '@/eventBus';
import { EVENTS } from 'consts';
import TrezorConnect from 'trezor-connect';

const pathBase = 'm';

export default class KeystoneKeyring extends MetaMaskKeyring {
  perPage = 10;

  constructor(opts = {}) {
    super();
    this.getMemStore().subscribe(({ sync, sign: { request } }) => {
      setTimeout(
        () =>
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.QRHARDWARE.STATUS_CHANGED,
            params: {
              request,
            },
          }),
        100
      );
    });
  }

  async getAddresses(start: number, end: number) {
    if (!this.initialized) {
      await this.readKeyring();
    }
    const accounts: {
      address: string;
      balance: number | null;
      index: number;
    }[] = [];
    for (let i = start; i < end; i++) {
      const address = await this.__addressFromIndex(pathBase, i);
      accounts.push({
        address,
        balance: null,
        index: i,
      });
      this.indexes[toChecksumAddress(address)] = i;
    }
    return accounts;
  }
}
