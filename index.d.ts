// index.d.ts
declare module "gshell-sdk" {
    export interface InitOptions {
      accessKey: string;
      userId?: string;
      eventNames?: string[];
      onMessage?: (event: string, data: any) => void;
    }
  
    export interface gShellRealtime {
      init: (options: InitOptions) => any;
      emit: (event: string, data: any) => void;
      disconnect: () => void;
    }
  
    export const gShell: {
      registerUser: (params: any) => Promise<any>;
      loginUser: (params: any) => Promise<any>;
      logoutUser: () => Promise<boolean>;
      getMyRow: (params: any) => Promise<any>;
      getAllMyRows: (params: any) => Promise<any>;
      addMyRow: (params: any) => Promise<any>;
      updateMyRow: (params: any) => Promise<any>;
      deleteMyRow: (params: any) => Promise<any>;
      uploadMyRow: (params: any) => Promise<string>;
      refreshMyRow: (params: any) => Promise<any>;
      getPublicRow: (params: any) => Promise<any>;
      getPublicUserRows: (params: any) => Promise<any>;
      updatePublicRow: (params: any) => Promise<any>;
      deletePublicRow: (params: any) => Promise<any>;
      autoParseLists: (rows: any[], columnTypes?: Record<string, string>) => any[];
    };
  
    const gShellRealtimeExport: gShellRealtime;
    export default gShellRealtimeExport;
  }
  