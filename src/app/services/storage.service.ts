import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async set(key: string, value: any) {
    if (!this._storage) {
      await this.init();
    }

    this._storage?.set(key, value);
  }

  async get(key: string) {
    if (!this._storage) {
      await this.init();
    }

    return this._storage?.get(key);
  }

  async remove(key: string) {
    if (!this._storage) {
      await this.init();
    }

    await this._storage?.remove(key);
  }

}
