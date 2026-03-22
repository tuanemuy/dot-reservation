// DomainEventBase - イベントの基本型
export type DomainEventBase<TType extends string, TPayload> = {
  readonly type: TType;
  readonly payload: TPayload;
  readonly occurredAt: Date;
};

// DomainEvent - すべてのドメインイベントの共用型（各ドメインで具体的なイベント型を定義する）
// biome-ignore lint/suspicious/noExplicitAny: 初期段階では any で定義
export type DomainEvent = DomainEventBase<string, any>;

// WithEvents - エンティティ操作の結果とイベントをまとめる型
export type WithEvents<TEntity, TEvent extends DomainEvent = DomainEvent> = {
  readonly entity: TEntity;
  readonly events: readonly TEvent[];
};
