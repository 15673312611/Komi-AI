var vu = Object.defineProperty;
var bu = (e, t, n) => t in e ? vu(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var nt = (e, t, n) => bu(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function so(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const st = {}, ns = [], on = () => {
}, wu = () => !1, zi = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), io = (e) => e.startsWith("onUpdate:"), wt = Object.assign, ro = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, ku = Object.prototype.hasOwnProperty, Ke = (e, t) => ku.call(e, t), pe = Array.isArray, ss = (e) => Hi(e) === "[object Map]", ll = (e) => Hi(e) === "[object Set]", _e = (e) => typeof e == "function", ft = (e) => typeof e == "string", Mn = (e) => typeof e == "symbol", at = (e) => e !== null && typeof e == "object", cl = (e) => (at(e) || _e(e)) && _e(e.then) && _e(e.catch), ul = Object.prototype.toString, Hi = (e) => ul.call(e), xu = (e) => Hi(e).slice(8, -1), fl = (e) => Hi(e) === "[object Object]", oo = (e) => ft(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Ps = /* @__PURE__ */ so(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), qi = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, Au = /-(\w)/g, On = qi(
  (e) => e.replace(Au, (t, n) => n ? n.toUpperCase() : "")
), Tu = /\B([A-Z])/g, Fn = qi(
  (e) => e.replace(Tu, "-$1").toLowerCase()
), hl = qi((e) => e.charAt(0).toUpperCase() + e.slice(1)), pr = qi(
  (e) => e ? `on${hl(e)}` : ""
), In = (e, t) => !Object.is(e, t), mi = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Pr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Mr = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let aa;
const Wi = () => aa || (aa = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function xe(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], i = ft(s) ? Ru(s) : xe(s);
      if (i)
        for (const r in i)
          t[r] = i[r];
    }
    return t;
  } else if (ft(e) || at(e))
    return e;
}
const Su = /;(?![^(]*\))/g, Eu = /:([^]+)/, Cu = /\/\*[^]*?\*\//g;
function Ru(e) {
  const t = {};
  return e.replace(Cu, "").split(Su).forEach((n) => {
    if (n) {
      const s = n.split(Eu);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function je(e) {
  let t = "";
  if (ft(e))
    t = e;
  else if (pe(e))
    for (let n = 0; n < e.length; n++) {
      const s = je(e[n]);
      s && (t += s + " ");
    }
  else if (at(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Iu = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Lu = /* @__PURE__ */ so(Iu);
function dl(e) {
  return !!e || e === "";
}
const pl = (e) => !!(e && e.__v_isRef === !0), ee = (e) => ft(e) ? e : e == null ? "" : pe(e) || at(e) && (e.toString === ul || !_e(e.toString)) ? pl(e) ? ee(e.value) : JSON.stringify(e, gl, 2) : String(e), gl = (e, t) => pl(t) ? gl(e, t.value) : ss(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, i], r) => (n[gr(s, r) + " =>"] = i, n),
    {}
  )
} : ll(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => gr(n))
} : Mn(t) ? gr(t) : at(t) && !pe(t) && !fl(t) ? String(t) : t, gr = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Mn(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Nt;
class Ou {
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.parent = Nt, !t && Nt && (this.index = (Nt.scopes || (Nt.scopes = [])).push(
      this
    ) - 1);
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = Nt;
      try {
        return Nt = this, t();
      } finally {
        Nt = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = Nt, Nt = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (Nt = this.prevScope, this.prevScope = void 0);
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, s = this.scopes.length; n < s; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const i = this.parent.scopes.pop();
        i && i !== this && (this.parent.scopes[this.index] = i, i.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Nu() {
  return Nt;
}
let ot;
const mr = /* @__PURE__ */ new WeakSet();
class ml {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, Nt && Nt.active && Nt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, mr.has(this) && (mr.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || yl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, la(this), vl(this);
    const t = ot, n = Qt;
    ot = this, Qt = !0;
    try {
      return this.fn();
    } finally {
      bl(this), ot = t, Qt = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        co(t);
      this.deps = this.depsTail = void 0, la(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? mr.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Fr(this) && this.run();
  }
  get dirty() {
    return Fr(this);
  }
}
let _l = 0, Ms, Fs;
function yl(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Fs, Fs = e;
    return;
  }
  e.next = Ms, Ms = e;
}
function ao() {
  _l++;
}
function lo() {
  if (--_l > 0)
    return;
  if (Fs) {
    let t = Fs;
    for (Fs = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Ms; ) {
    let t = Ms;
    for (Ms = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (s) {
          e || (e = s);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function vl(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function bl(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const i = s.prevDep;
    s.version === -1 ? (s === n && (n = i), co(s), Pu(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = i;
  }
  e.deps = t, e.depsTail = n;
}
function Fr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (wl(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function wl(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Hs) || (e.globalVersion = Hs, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Fr(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = ot, s = Qt;
  ot = e, Qt = !0;
  try {
    vl(e);
    const i = e.fn(e._value);
    (t.version === 0 || In(i, e._value)) && (e.flags |= 128, e._value = i, t.version++);
  } catch (i) {
    throw t.version++, i;
  } finally {
    ot = n, Qt = s, bl(e), e.flags &= -3;
  }
}
function co(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: i } = e;
  if (s && (s.nextSub = i, e.prevSub = void 0), i && (i.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      co(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Pu(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Qt = !0;
const kl = [];
function bn() {
  kl.push(Qt), Qt = !1;
}
function wn() {
  const e = kl.pop();
  Qt = e === void 0 ? !0 : e;
}
function la(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = ot;
    ot = void 0;
    try {
      t();
    } finally {
      ot = n;
    }
  }
}
let Hs = 0;
class Mu {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class uo {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!ot || !Qt || ot === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== ot)
      n = this.activeLink = new Mu(ot, this), ot.deps ? (n.prevDep = ot.depsTail, ot.depsTail.nextDep = n, ot.depsTail = n) : ot.deps = ot.depsTail = n, xl(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = ot.depsTail, n.nextDep = void 0, ot.depsTail.nextDep = n, ot.depsTail = n, ot.deps === n && (ot.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, Hs++, this.notify(t);
  }
  notify(t) {
    ao();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      lo();
    }
  }
}
function xl(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        xl(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const Dr = /* @__PURE__ */ new WeakMap(), jn = Symbol(
  ""
), Br = Symbol(
  ""
), qs = Symbol(
  ""
);
function vt(e, t, n) {
  if (Qt && ot) {
    let s = Dr.get(e);
    s || Dr.set(e, s = /* @__PURE__ */ new Map());
    let i = s.get(n);
    i || (s.set(n, i = new uo()), i.map = s, i.key = n), i.track();
  }
}
function mn(e, t, n, s, i, r) {
  const o = Dr.get(e);
  if (!o) {
    Hs++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (ao(), t === "clear")
    o.forEach(a);
  else {
    const l = pe(e), h = l && oo(n);
    if (l && n === "length") {
      const c = Number(s);
      o.forEach((w, m) => {
        (m === "length" || m === qs || !Mn(m) && m >= c) && a(w);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), h && a(o.get(qs)), t) {
        case "add":
          l ? h && a(o.get("length")) : (a(o.get(jn)), ss(e) && a(o.get(Br)));
          break;
        case "delete":
          l || (a(o.get(jn)), ss(e) && a(o.get(Br)));
          break;
        case "set":
          ss(e) && a(o.get(jn));
          break;
      }
  }
  lo();
}
function Qn(e) {
  const t = Ve(e);
  return t === e ? t : (vt(t, "iterate", qs), Vt(e) ? t : t.map(_t));
}
function ji(e) {
  return vt(e = Ve(e), "iterate", qs), e;
}
const Fu = {
  __proto__: null,
  [Symbol.iterator]() {
    return _r(this, Symbol.iterator, _t);
  },
  concat(...e) {
    return Qn(this).concat(
      ...e.map((t) => pe(t) ? Qn(t) : t)
    );
  },
  entries() {
    return _r(this, "entries", (e) => (e[1] = _t(e[1]), e));
  },
  every(e, t) {
    return hn(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return hn(this, "filter", e, t, (n) => n.map(_t), arguments);
  },
  find(e, t) {
    return hn(this, "find", e, t, _t, arguments);
  },
  findIndex(e, t) {
    return hn(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return hn(this, "findLast", e, t, _t, arguments);
  },
  findLastIndex(e, t) {
    return hn(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return hn(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return yr(this, "includes", e);
  },
  indexOf(...e) {
    return yr(this, "indexOf", e);
  },
  join(e) {
    return Qn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return yr(this, "lastIndexOf", e);
  },
  map(e, t) {
    return hn(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return ys(this, "pop");
  },
  push(...e) {
    return ys(this, "push", e);
  },
  reduce(e, ...t) {
    return ca(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return ca(this, "reduceRight", e, t);
  },
  shift() {
    return ys(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return hn(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return ys(this, "splice", e);
  },
  toReversed() {
    return Qn(this).toReversed();
  },
  toSorted(e) {
    return Qn(this).toSorted(e);
  },
  toSpliced(...e) {
    return Qn(this).toSpliced(...e);
  },
  unshift(...e) {
    return ys(this, "unshift", e);
  },
  values() {
    return _r(this, "values", _t);
  }
};
function _r(e, t, n) {
  const s = ji(e), i = s[t]();
  return s !== e && !Vt(e) && (i._next = i.next, i.next = () => {
    const r = i._next();
    return r.value && (r.value = n(r.value)), r;
  }), i;
}
const Du = Array.prototype;
function hn(e, t, n, s, i, r) {
  const o = ji(e), a = o !== e && !Vt(e), l = o[t];
  if (l !== Du[t]) {
    const w = l.apply(e, r);
    return a ? _t(w) : w;
  }
  let h = n;
  o !== e && (a ? h = function(w, m) {
    return n.call(this, _t(w), m, e);
  } : n.length > 2 && (h = function(w, m) {
    return n.call(this, w, m, e);
  }));
  const c = l.call(o, h, s);
  return a && i ? i(c) : c;
}
function ca(e, t, n, s) {
  const i = ji(e);
  let r = n;
  return i !== e && (Vt(e) ? n.length > 3 && (r = function(o, a, l) {
    return n.call(this, o, a, l, e);
  }) : r = function(o, a, l) {
    return n.call(this, o, _t(a), l, e);
  }), i[t](r, ...s);
}
function yr(e, t, n) {
  const s = Ve(e);
  vt(s, "iterate", qs);
  const i = s[t](...n);
  return (i === -1 || i === !1) && po(n[0]) ? (n[0] = Ve(n[0]), s[t](...n)) : i;
}
function ys(e, t, n = []) {
  bn(), ao();
  const s = Ve(e)[t].apply(e, n);
  return lo(), wn(), s;
}
const Bu = /* @__PURE__ */ so("__proto__,__v_isRef,__isVue"), Al = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Mn)
);
function $u(e) {
  Mn(e) || (e = String(e));
  const t = Ve(this);
  return vt(t, "has", e), t.hasOwnProperty(e);
}
class Tl {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const i = this._isReadonly, r = this._isShallow;
    if (n === "__v_isReactive")
      return !i;
    if (n === "__v_isReadonly")
      return i;
    if (n === "__v_isShallow")
      return r;
    if (n === "__v_raw")
      return s === (i ? r ? Yu : Rl : r ? Cl : El).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const o = pe(t);
    if (!i) {
      let l;
      if (o && (l = Fu[n]))
        return l;
      if (n === "hasOwnProperty")
        return $u;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      bt(t) ? t : s
    );
    return (Mn(n) ? Al.has(n) : Bu(n)) || (i || vt(t, "get", n), r) ? a : bt(a) ? o && oo(n) ? a : a.value : at(a) ? i ? Il(a) : Vi(a) : a;
  }
}
class Sl extends Tl {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, i) {
    let r = t[n];
    if (!this._isShallow) {
      const l = Nn(r);
      if (!Vt(s) && !Nn(s) && (r = Ve(r), s = Ve(s)), !pe(t) && bt(r) && !bt(s))
        return l ? !1 : (r.value = s, !0);
    }
    const o = pe(t) && oo(n) ? Number(n) < t.length : Ke(t, n), a = Reflect.set(
      t,
      n,
      s,
      bt(t) ? t : i
    );
    return t === Ve(i) && (o ? In(s, r) && mn(t, "set", n, s) : mn(t, "add", n, s)), a;
  }
  deleteProperty(t, n) {
    const s = Ke(t, n);
    t[n];
    const i = Reflect.deleteProperty(t, n);
    return i && s && mn(t, "delete", n, void 0), i;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Mn(n) || !Al.has(n)) && vt(t, "has", n), s;
  }
  ownKeys(t) {
    return vt(
      t,
      "iterate",
      pe(t) ? "length" : jn
    ), Reflect.ownKeys(t);
  }
}
class Uu extends Tl {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const zu = /* @__PURE__ */ new Sl(), Hu = /* @__PURE__ */ new Uu(), qu = /* @__PURE__ */ new Sl(!0);
const $r = (e) => e, li = (e) => Reflect.getPrototypeOf(e);
function Wu(e, t, n) {
  return function(...s) {
    const i = this.__v_raw, r = Ve(i), o = ss(r), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, h = i[e](...s), c = n ? $r : t ? Ii : _t;
    return !t && vt(
      r,
      "iterate",
      l ? Br : jn
    ), {
      // iterator protocol
      next() {
        const { value: w, done: m } = h.next();
        return m ? { value: w, done: m } : {
          value: a ? [c(w[0]), c(w[1])] : c(w),
          done: m
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function ci(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function ju(e, t) {
  const n = {
    get(i) {
      const r = this.__v_raw, o = Ve(r), a = Ve(i);
      e || (In(i, a) && vt(o, "get", i), vt(o, "get", a));
      const { has: l } = li(o), h = t ? $r : e ? Ii : _t;
      if (l.call(o, i))
        return h(r.get(i));
      if (l.call(o, a))
        return h(r.get(a));
      r !== o && r.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return !e && vt(Ve(i), "iterate", jn), Reflect.get(i, "size", i);
    },
    has(i) {
      const r = this.__v_raw, o = Ve(r), a = Ve(i);
      return e || (In(i, a) && vt(o, "has", i), vt(o, "has", a)), i === a ? r.has(i) : r.has(i) || r.has(a);
    },
    forEach(i, r) {
      const o = this, a = o.__v_raw, l = Ve(a), h = t ? $r : e ? Ii : _t;
      return !e && vt(l, "iterate", jn), a.forEach((c, w) => i.call(r, h(c), h(w), o));
    }
  };
  return wt(
    n,
    e ? {
      add: ci("add"),
      set: ci("set"),
      delete: ci("delete"),
      clear: ci("clear")
    } : {
      add(i) {
        !t && !Vt(i) && !Nn(i) && (i = Ve(i));
        const r = Ve(this);
        return li(r).has.call(r, i) || (r.add(i), mn(r, "add", i, i)), this;
      },
      set(i, r) {
        !t && !Vt(r) && !Nn(r) && (r = Ve(r));
        const o = Ve(this), { has: a, get: l } = li(o);
        let h = a.call(o, i);
        h || (i = Ve(i), h = a.call(o, i));
        const c = l.call(o, i);
        return o.set(i, r), h ? In(r, c) && mn(o, "set", i, r) : mn(o, "add", i, r), this;
      },
      delete(i) {
        const r = Ve(this), { has: o, get: a } = li(r);
        let l = o.call(r, i);
        l || (i = Ve(i), l = o.call(r, i)), a && a.call(r, i);
        const h = r.delete(i);
        return l && mn(r, "delete", i, void 0), h;
      },
      clear() {
        const i = Ve(this), r = i.size !== 0, o = i.clear();
        return r && mn(
          i,
          "clear",
          void 0,
          void 0
        ), o;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((i) => {
    n[i] = Wu(i, e, t);
  }), n;
}
function fo(e, t) {
  const n = ju(e, t);
  return (s, i, r) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_raw" ? s : Reflect.get(
    Ke(n, i) && i in s ? n : s,
    i,
    r
  );
}
const Vu = {
  get: /* @__PURE__ */ fo(!1, !1)
}, Ku = {
  get: /* @__PURE__ */ fo(!1, !0)
}, Gu = {
  get: /* @__PURE__ */ fo(!0, !1)
};
const El = /* @__PURE__ */ new WeakMap(), Cl = /* @__PURE__ */ new WeakMap(), Rl = /* @__PURE__ */ new WeakMap(), Yu = /* @__PURE__ */ new WeakMap();
function Xu(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function Zu(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Xu(xu(e));
}
function Vi(e) {
  return Nn(e) ? e : ho(
    e,
    !1,
    zu,
    Vu,
    El
  );
}
function Ju(e) {
  return ho(
    e,
    !1,
    qu,
    Ku,
    Cl
  );
}
function Il(e) {
  return ho(
    e,
    !0,
    Hu,
    Gu,
    Rl
  );
}
function ho(e, t, n, s, i) {
  if (!at(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const r = Zu(e);
  if (r === 0)
    return e;
  const o = i.get(e);
  if (o)
    return o;
  const a = new Proxy(
    e,
    r === 2 ? s : n
  );
  return i.set(e, a), a;
}
function is(e) {
  return Nn(e) ? is(e.__v_raw) : !!(e && e.__v_isReactive);
}
function Nn(e) {
  return !!(e && e.__v_isReadonly);
}
function Vt(e) {
  return !!(e && e.__v_isShallow);
}
function po(e) {
  return e ? !!e.__v_raw : !1;
}
function Ve(e) {
  const t = e && e.__v_raw;
  return t ? Ve(t) : e;
}
function Qu(e) {
  return !Ke(e, "__v_skip") && Object.isExtensible(e) && Pr(e, "__v_skip", !0), e;
}
const _t = (e) => at(e) ? Vi(e) : e, Ii = (e) => at(e) ? Il(e) : e;
function bt(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ie(e) {
  return ef(e, !1);
}
function ef(e, t) {
  return bt(e) ? e : new tf(e, t);
}
class tf {
  constructor(t, n) {
    this.dep = new uo(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : Ve(t), this._value = n ? t : _t(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || Vt(t) || Nn(t);
    t = s ? t : Ve(t), In(t, n) && (this._rawValue = t, this._value = s ? t : _t(t), this.dep.trigger());
  }
}
function E(e) {
  return bt(e) ? e.value : e;
}
const nf = {
  get: (e, t, n) => t === "__v_raw" ? e : E(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const i = e[t];
    return bt(i) && !bt(n) ? (i.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Ll(e) {
  return is(e) ? e : new Proxy(e, nf);
}
class sf {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new uo(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Hs - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    ot !== this)
      return yl(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return wl(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function rf(e, t, n = !1) {
  let s, i;
  return _e(e) ? s = e : (s = e.get, i = e.set), new sf(s, i, n);
}
const ui = {}, Li = /* @__PURE__ */ new WeakMap();
let qn;
function of(e, t = !1, n = qn) {
  if (n) {
    let s = Li.get(n);
    s || Li.set(n, s = []), s.push(e);
  }
}
function af(e, t, n = st) {
  const { immediate: s, deep: i, once: r, scheduler: o, augmentJob: a, call: l } = n, h = (T) => i ? T : Vt(T) || i === !1 || i === 0 ? _n(T, 1) : _n(T);
  let c, w, m, P, M = !1, K = !1;
  if (bt(e) ? (w = () => e.value, M = Vt(e)) : is(e) ? (w = () => h(e), M = !0) : pe(e) ? (K = !0, M = e.some((T) => is(T) || Vt(T)), w = () => e.map((T) => {
    if (bt(T))
      return T.value;
    if (is(T))
      return h(T);
    if (_e(T))
      return l ? l(T, 2) : T();
  })) : _e(e) ? t ? w = l ? () => l(e, 2) : e : w = () => {
    if (m) {
      bn();
      try {
        m();
      } finally {
        wn();
      }
    }
    const T = qn;
    qn = c;
    try {
      return l ? l(e, 3, [P]) : e(P);
    } finally {
      qn = T;
    }
  } : w = on, t && i) {
    const T = w, I = i === !0 ? 1 / 0 : i;
    w = () => _n(T(), I);
  }
  const Pe = Nu(), fe = () => {
    c.stop(), Pe && Pe.active && ro(Pe.effects, c);
  };
  if (r && t) {
    const T = t;
    t = (...I) => {
      T(...I), fe();
    };
  }
  let ge = K ? new Array(e.length).fill(ui) : ui;
  const ve = (T) => {
    if (!(!(c.flags & 1) || !c.dirty && !T))
      if (t) {
        const I = c.run();
        if (i || M || (K ? I.some((j, G) => In(j, ge[G])) : In(I, ge))) {
          m && m();
          const j = qn;
          qn = c;
          try {
            const G = [
              I,
              // pass undefined as the old value when it's changed for the first time
              ge === ui ? void 0 : K && ge[0] === ui ? [] : ge,
              P
            ];
            ge = I, l ? l(t, 3, G) : (
              // @ts-expect-error
              t(...G)
            );
          } finally {
            qn = j;
          }
        }
      } else
        c.run();
  };
  return a && a(ve), c = new ml(w), c.scheduler = o ? () => o(ve, !1) : ve, P = (T) => of(T, !1, c), m = c.onStop = () => {
    const T = Li.get(c);
    if (T) {
      if (l)
        l(T, 4);
      else
        for (const I of T) I();
      Li.delete(c);
    }
  }, t ? s ? ve(!0) : ge = c.run() : o ? o(ve.bind(null, !0), !0) : c.run(), fe.pause = c.pause.bind(c), fe.resume = c.resume.bind(c), fe.stop = fe, fe;
}
function _n(e, t = 1 / 0, n) {
  if (t <= 0 || !at(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(e)))
    return e;
  if (n.add(e), t--, bt(e))
    _n(e.value, t, n);
  else if (pe(e))
    for (let s = 0; s < e.length; s++)
      _n(e[s], t, n);
  else if (ll(e) || ss(e))
    e.forEach((s) => {
      _n(s, t, n);
    });
  else if (fl(e)) {
    for (const s in e)
      _n(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && _n(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Gs(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (i) {
    Ki(i, t, n);
  }
}
function cn(e, t, n, s) {
  if (_e(e)) {
    const i = Gs(e, t, n, s);
    return i && cl(i) && i.catch((r) => {
      Ki(r, t, n);
    }), i;
  }
  if (pe(e)) {
    const i = [];
    for (let r = 0; r < e.length; r++)
      i.push(cn(e[r], t, n, s));
    return i;
  }
}
function Ki(e, t, n, s = !0) {
  const i = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: o } = t && t.appContext.config || st;
  if (t) {
    let a = t.parent;
    const l = t.proxy, h = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let w = 0; w < c.length; w++)
          if (c[w](e, l, h) === !1)
            return;
      }
      a = a.parent;
    }
    if (r) {
      bn(), Gs(r, null, 10, [
        e,
        l,
        h
      ]), wn();
      return;
    }
  }
  lf(e, n, i, s, o);
}
function lf(e, t, n, s = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const Et = [];
let sn = -1;
const rs = [];
let Cn = null, es = 0;
const Ol = /* @__PURE__ */ Promise.resolve();
let Oi = null;
function os(e) {
  const t = Oi || Ol;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function cf(e) {
  let t = sn + 1, n = Et.length;
  for (; t < n; ) {
    const s = t + n >>> 1, i = Et[s], r = Ws(i);
    r < e || r === e && i.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function go(e) {
  if (!(e.flags & 1)) {
    const t = Ws(e), n = Et[Et.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Ws(n) ? Et.push(e) : Et.splice(cf(t), 0, e), e.flags |= 1, Nl();
  }
}
function Nl() {
  Oi || (Oi = Ol.then(Ml));
}
function uf(e) {
  pe(e) ? rs.push(...e) : Cn && e.id === -1 ? Cn.splice(es + 1, 0, e) : e.flags & 1 || (rs.push(e), e.flags |= 1), Nl();
}
function ua(e, t, n = sn + 1) {
  for (; n < Et.length; n++) {
    const s = Et[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      Et.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Pl(e) {
  if (rs.length) {
    const t = [...new Set(rs)].sort(
      (n, s) => Ws(n) - Ws(s)
    );
    if (rs.length = 0, Cn) {
      Cn.push(...t);
      return;
    }
    for (Cn = t, es = 0; es < Cn.length; es++) {
      const n = Cn[es];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    Cn = null, es = 0;
  }
}
const Ws = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Ml(e) {
  try {
    for (sn = 0; sn < Et.length; sn++) {
      const t = Et[sn];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Gs(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; sn < Et.length; sn++) {
      const t = Et[sn];
      t && (t.flags &= -2);
    }
    sn = -1, Et.length = 0, Pl(), Oi = null, (Et.length || rs.length) && Ml();
  }
}
let jt = null, Fl = null;
function Ni(e) {
  const t = jt;
  return jt = e, Fl = e && e.type.__scopeId || null, t;
}
function ff(e, t = jt, n) {
  if (!t || e._n)
    return e;
  const s = (...i) => {
    s._d && va(-1);
    const r = Ni(t);
    let o;
    try {
      o = e(...i);
    } finally {
      Ni(r), s._d && va(1);
    }
    return o;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function En(e, t) {
  if (jt === null)
    return e;
  const n = Ji(jt), s = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [r, o, a, l = st] = t[i];
    r && (_e(r) && (r = {
      mounted: r,
      updated: r
    }), r.deep && _n(o), s.push({
      dir: r,
      instance: n,
      value: o,
      oldValue: void 0,
      arg: a,
      modifiers: l
    }));
  }
  return e;
}
function $n(e, t, n, s) {
  const i = e.dirs, r = t && t.dirs;
  for (let o = 0; o < i.length; o++) {
    const a = i[o];
    r && (a.oldValue = r[o].value);
    let l = a.dir[s];
    l && (bn(), cn(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), wn());
  }
}
const hf = Symbol("_vte"), df = (e) => e.__isTeleport;
function mo(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, mo(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Dl(e, t) {
  return _e(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    wt({ name: e.name }, t, { setup: e })
  ) : e;
}
function Bl(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Ds(e, t, n, s, i = !1) {
  if (pe(e)) {
    e.forEach(
      (M, K) => Ds(
        M,
        t && (pe(t) ? t[K] : t),
        n,
        s,
        i
      )
    );
    return;
  }
  if (Bs(s) && !i) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ds(e, t, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? Ji(s.component) : s.el, o = i ? null : r, { i: a, r: l } = e, h = t && t.r, c = a.refs === st ? a.refs = {} : a.refs, w = a.setupState, m = Ve(w), P = w === st ? () => !1 : (M) => Ke(m, M);
  if (h != null && h !== l && (ft(h) ? (c[h] = null, P(h) && (w[h] = null)) : bt(h) && (h.value = null)), _e(l))
    Gs(l, a, 12, [o, c]);
  else {
    const M = ft(l), K = bt(l);
    if (M || K) {
      const Pe = () => {
        if (e.f) {
          const fe = M ? P(l) ? w[l] : c[l] : l.value;
          i ? pe(fe) && ro(fe, r) : pe(fe) ? fe.includes(r) || fe.push(r) : M ? (c[l] = [r], P(l) && (w[l] = c[l])) : (l.value = [r], e.k && (c[e.k] = l.value));
        } else M ? (c[l] = o, P(l) && (w[l] = o)) : K && (l.value = o, e.k && (c[e.k] = o));
      };
      o ? (Pe.id = -1, Bt(Pe, n)) : Pe();
    }
  }
}
Wi().requestIdleCallback;
Wi().cancelIdleCallback;
const Bs = (e) => !!e.type.__asyncLoader, $l = (e) => e.type.__isKeepAlive;
function pf(e, t) {
  Ul(e, "a", t);
}
function gf(e, t) {
  Ul(e, "da", t);
}
function Ul(e, t, n = Ct) {
  const s = e.__wdc || (e.__wdc = () => {
    let i = n;
    for (; i; ) {
      if (i.isDeactivated)
        return;
      i = i.parent;
    }
    return e();
  });
  if (Gi(t, s, n), n) {
    let i = n.parent;
    for (; i && i.parent; )
      $l(i.parent.vnode) && mf(s, t, n, i), i = i.parent;
  }
}
function mf(e, t, n, s) {
  const i = Gi(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Ys(() => {
    ro(s[t], i);
  }, n);
}
function Gi(e, t, n = Ct, s = !1) {
  if (n) {
    const i = n[e] || (n[e] = []), r = t.__weh || (t.__weh = (...o) => {
      bn();
      const a = Xs(n), l = cn(t, n, e, o);
      return a(), wn(), l;
    });
    return s ? i.unshift(r) : i.push(r), r;
  }
}
const kn = (e) => (t, n = Ct) => {
  (!Vs || e === "sp") && Gi(e, (...s) => t(...s), n);
}, _f = kn("bm"), Yi = kn("m"), yf = kn(
  "bu"
), vf = kn("u"), zl = kn(
  "bum"
), Ys = kn("um"), bf = kn(
  "sp"
), wf = kn("rtg"), kf = kn("rtc");
function xf(e, t = Ct) {
  Gi("ec", e, t);
}
const Af = Symbol.for("v-ndc");
function mt(e, t, n, s) {
  let i;
  const r = n, o = pe(e);
  if (o || ft(e)) {
    const a = o && is(e);
    let l = !1, h = !1;
    a && (l = !Vt(e), h = Nn(e), e = ji(e)), i = new Array(e.length);
    for (let c = 0, w = e.length; c < w; c++)
      i[c] = t(
        l ? h ? Ii(_t(e[c])) : _t(e[c]) : e[c],
        c,
        void 0,
        r
      );
  } else if (typeof e == "number") {
    i = new Array(e);
    for (let a = 0; a < e; a++)
      i[a] = t(a + 1, a, void 0, r);
  } else if (at(e))
    if (e[Symbol.iterator])
      i = Array.from(
        e,
        (a, l) => t(a, l, void 0, r)
      );
    else {
      const a = Object.keys(e);
      i = new Array(a.length);
      for (let l = 0, h = a.length; l < h; l++) {
        const c = a[l];
        i[l] = t(e[c], c, l, r);
      }
    }
  else
    i = [];
  return i;
}
const Ur = (e) => e ? cc(e) ? Ji(e) : Ur(e.parent) : null, $s = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ wt(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Ur(e.parent),
    $root: (e) => Ur(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ql(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      go(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = os.bind(e.proxy)),
    $watch: (e) => Vf.bind(e)
  })
), vr = (e, t) => e !== st && !e.__isScriptSetup && Ke(e, t), Tf = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: i, props: r, accessCache: o, type: a, appContext: l } = e;
    let h;
    if (t[0] !== "$") {
      const P = o[t];
      if (P !== void 0)
        switch (P) {
          case 1:
            return s[t];
          case 2:
            return i[t];
          case 4:
            return n[t];
          case 3:
            return r[t];
        }
      else {
        if (vr(s, t))
          return o[t] = 1, s[t];
        if (i !== st && Ke(i, t))
          return o[t] = 2, i[t];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (h = e.propsOptions[0]) && Ke(h, t)
        )
          return o[t] = 3, r[t];
        if (n !== st && Ke(n, t))
          return o[t] = 4, n[t];
        zr && (o[t] = 0);
      }
    }
    const c = $s[t];
    let w, m;
    if (c)
      return t === "$attrs" && vt(e.attrs, "get", ""), c(e);
    if (
      // css module (injected by vue-loader)
      (w = a.__cssModules) && (w = w[t])
    )
      return w;
    if (n !== st && Ke(n, t))
      return o[t] = 4, n[t];
    if (
      // global properties
      m = l.config.globalProperties, Ke(m, t)
    )
      return m[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: i, ctx: r } = e;
    return vr(i, t) ? (i[t] = n, !0) : s !== st && Ke(s, t) ? (s[t] = n, !0) : Ke(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: i, propsOptions: r }
  }, o) {
    let a;
    return !!n[o] || e !== st && Ke(e, o) || vr(t, o) || (a = r[0]) && Ke(a, o) || Ke(s, o) || Ke($s, o) || Ke(i.config.globalProperties, o);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : Ke(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function fa(e) {
  return pe(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let zr = !0;
function Sf(e) {
  const t = ql(e), n = e.proxy, s = e.ctx;
  zr = !1, t.beforeCreate && ha(t.beforeCreate, e, "bc");
  const {
    // state
    data: i,
    computed: r,
    methods: o,
    watch: a,
    provide: l,
    inject: h,
    // lifecycle
    created: c,
    beforeMount: w,
    mounted: m,
    beforeUpdate: P,
    updated: M,
    activated: K,
    deactivated: Pe,
    beforeDestroy: fe,
    beforeUnmount: ge,
    destroyed: ve,
    unmounted: T,
    render: I,
    renderTracked: j,
    renderTriggered: G,
    errorCaptured: Ae,
    serverPrefetch: ze,
    // public API
    expose: Ze,
    inheritAttrs: Re,
    // assets
    components: ye,
    directives: Qe,
    filters: it
  } = t;
  if (h && Ef(h, s, null), o)
    for (const de in o) {
      const ae = o[de];
      _e(ae) && (s[de] = ae.bind(n));
    }
  if (i) {
    const de = i.call(n, n);
    at(de) && (e.data = Vi(de));
  }
  if (zr = !0, r)
    for (const de in r) {
      const ae = r[de], Se = _e(ae) ? ae.bind(n, n) : _e(ae.get) ? ae.get.bind(n, n) : on, rt = !_e(ae) && _e(ae.set) ? ae.set.bind(n) : on, oe = ce({
        get: Se,
        set: rt
      });
      Object.defineProperty(s, de, {
        enumerable: !0,
        configurable: !0,
        get: () => oe.value,
        set: (Me) => oe.value = Me
      });
    }
  if (a)
    for (const de in a)
      Hl(a[de], s, n, de);
  if (l) {
    const de = _e(l) ? l.call(n) : l;
    Reflect.ownKeys(de).forEach((ae) => {
      Nf(ae, de[ae]);
    });
  }
  c && ha(c, e, "c");
  function ue(de, ae) {
    pe(ae) ? ae.forEach((Se) => de(Se.bind(n))) : ae && de(ae.bind(n));
  }
  if (ue(_f, w), ue(Yi, m), ue(yf, P), ue(vf, M), ue(pf, K), ue(gf, Pe), ue(xf, Ae), ue(kf, j), ue(wf, G), ue(zl, ge), ue(Ys, T), ue(bf, ze), pe(Ze))
    if (Ze.length) {
      const de = e.exposed || (e.exposed = {});
      Ze.forEach((ae) => {
        Object.defineProperty(de, ae, {
          get: () => n[ae],
          set: (Se) => n[ae] = Se,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  I && e.render === on && (e.render = I), Re != null && (e.inheritAttrs = Re), ye && (e.components = ye), Qe && (e.directives = Qe), ze && Bl(e);
}
function Ef(e, t, n = on) {
  pe(e) && (e = Hr(e));
  for (const s in e) {
    const i = e[s];
    let r;
    at(i) ? "default" in i ? r = _i(
      i.from || s,
      i.default,
      !0
    ) : r = _i(i.from || s) : r = _i(i), bt(r) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => r.value,
      set: (o) => r.value = o
    }) : t[s] = r;
  }
}
function ha(e, t, n) {
  cn(
    pe(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Hl(e, t, n, s) {
  let i = s.includes(".") ? nc(n, s) : () => n[s];
  if (ft(e)) {
    const r = t[e];
    _e(r) && Wt(i, r);
  } else if (_e(e))
    Wt(i, e.bind(n));
  else if (at(e))
    if (pe(e))
      e.forEach((r) => Hl(r, t, n, s));
    else {
      const r = _e(e.handler) ? e.handler.bind(n) : t[e.handler];
      _e(r) && Wt(i, r, e);
    }
}
function ql(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: i,
    optionsCache: r,
    config: { optionMergeStrategies: o }
  } = e.appContext, a = r.get(t);
  let l;
  return a ? l = a : !i.length && !n && !s ? l = t : (l = {}, i.length && i.forEach(
    (h) => Pi(l, h, o, !0)
  ), Pi(l, t, o)), at(t) && r.set(t, l), l;
}
function Pi(e, t, n, s = !1) {
  const { mixins: i, extends: r } = t;
  r && Pi(e, r, n, !0), i && i.forEach(
    (o) => Pi(e, o, n, !0)
  );
  for (const o in t)
    if (!(s && o === "expose")) {
      const a = Cf[o] || n && n[o];
      e[o] = a ? a(e[o], t[o]) : t[o];
    }
  return e;
}
const Cf = {
  data: da,
  props: pa,
  emits: pa,
  // objects
  methods: Ls,
  computed: Ls,
  // lifecycle
  beforeCreate: St,
  created: St,
  beforeMount: St,
  mounted: St,
  beforeUpdate: St,
  updated: St,
  beforeDestroy: St,
  beforeUnmount: St,
  destroyed: St,
  unmounted: St,
  activated: St,
  deactivated: St,
  errorCaptured: St,
  serverPrefetch: St,
  // assets
  components: Ls,
  directives: Ls,
  // watch
  watch: If,
  // provide / inject
  provide: da,
  inject: Rf
};
function da(e, t) {
  return t ? e ? function() {
    return wt(
      _e(e) ? e.call(this, this) : e,
      _e(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Rf(e, t) {
  return Ls(Hr(e), Hr(t));
}
function Hr(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function St(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Ls(e, t) {
  return e ? wt(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function pa(e, t) {
  return e ? pe(e) && pe(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : wt(
    /* @__PURE__ */ Object.create(null),
    fa(e),
    fa(t ?? {})
  ) : t;
}
function If(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = wt(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = St(e[s], t[s]);
  return n;
}
function Wl() {
  return {
    app: null,
    config: {
      isNativeTag: wu,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let Lf = 0;
function Of(e, t) {
  return function(s, i = null) {
    _e(s) || (s = wt({}, s)), i != null && !at(i) && (i = null);
    const r = Wl(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const h = r.app = {
      _uid: Lf++,
      _component: s,
      _props: i,
      _container: null,
      _context: r,
      _instance: null,
      version: dh,
      get config() {
        return r.config;
      },
      set config(c) {
      },
      use(c, ...w) {
        return o.has(c) || (c && _e(c.install) ? (o.add(c), c.install(h, ...w)) : _e(c) && (o.add(c), c(h, ...w))), h;
      },
      mixin(c) {
        return r.mixins.includes(c) || r.mixins.push(c), h;
      },
      component(c, w) {
        return w ? (r.components[c] = w, h) : r.components[c];
      },
      directive(c, w) {
        return w ? (r.directives[c] = w, h) : r.directives[c];
      },
      mount(c, w, m) {
        if (!l) {
          const P = h._ceVNode || an(s, i);
          return P.appContext = r, m === !0 ? m = "svg" : m === !1 && (m = void 0), e(P, c, m), l = !0, h._container = c, c.__vue_app__ = h, Ji(P.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        l && (cn(
          a,
          h._instance,
          16
        ), e(null, h._container), delete h._container.__vue_app__);
      },
      provide(c, w) {
        return r.provides[c] = w, h;
      },
      runWithContext(c) {
        const w = as;
        as = h;
        try {
          return c();
        } finally {
          as = w;
        }
      }
    };
    return h;
  };
}
let as = null;
function Nf(e, t) {
  if (Ct) {
    let n = Ct.provides;
    const s = Ct.parent && Ct.parent.provides;
    s === n && (n = Ct.provides = Object.create(s)), n[e] = t;
  }
}
function _i(e, t, n = !1) {
  const s = ah();
  if (s || as) {
    let i = as ? as._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && _e(t) ? t.call(s && s.proxy) : t;
  }
}
const jl = {}, Vl = () => Object.create(jl), Kl = (e) => Object.getPrototypeOf(e) === jl;
function Pf(e, t, n, s = !1) {
  const i = {}, r = Vl();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Gl(e, t, i, r);
  for (const o in e.propsOptions[0])
    o in i || (i[o] = void 0);
  n ? e.props = s ? i : Ju(i) : e.type.props ? e.props = i : e.props = r, e.attrs = r;
}
function Mf(e, t, n, s) {
  const {
    props: i,
    attrs: r,
    vnode: { patchFlag: o }
  } = e, a = Ve(i), [l] = e.propsOptions;
  let h = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const c = e.vnode.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        let m = c[w];
        if (Xi(e.emitsOptions, m))
          continue;
        const P = t[m];
        if (l)
          if (Ke(r, m))
            P !== r[m] && (r[m] = P, h = !0);
          else {
            const M = On(m);
            i[M] = qr(
              l,
              a,
              M,
              P,
              e,
              !1
            );
          }
        else
          P !== r[m] && (r[m] = P, h = !0);
      }
    }
  } else {
    Gl(e, t, i, r) && (h = !0);
    let c;
    for (const w in a)
      (!t || // for camelCase
      !Ke(t, w) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = Fn(w)) === w || !Ke(t, c))) && (l ? n && // for camelCase
      (n[w] !== void 0 || // for kebab-case
      n[c] !== void 0) && (i[w] = qr(
        l,
        a,
        w,
        void 0,
        e,
        !0
      )) : delete i[w]);
    if (r !== a)
      for (const w in r)
        (!t || !Ke(t, w)) && (delete r[w], h = !0);
  }
  h && mn(e.attrs, "set", "");
}
function Gl(e, t, n, s) {
  const [i, r] = e.propsOptions;
  let o = !1, a;
  if (t)
    for (let l in t) {
      if (Ps(l))
        continue;
      const h = t[l];
      let c;
      i && Ke(i, c = On(l)) ? !r || !r.includes(c) ? n[c] = h : (a || (a = {}))[c] = h : Xi(e.emitsOptions, l) || (!(l in s) || h !== s[l]) && (s[l] = h, o = !0);
    }
  if (r) {
    const l = Ve(n), h = a || st;
    for (let c = 0; c < r.length; c++) {
      const w = r[c];
      n[w] = qr(
        i,
        l,
        w,
        h[w],
        e,
        !Ke(h, w)
      );
    }
  }
  return o;
}
function qr(e, t, n, s, i, r) {
  const o = e[n];
  if (o != null) {
    const a = Ke(o, "default");
    if (a && s === void 0) {
      const l = o.default;
      if (o.type !== Function && !o.skipFactory && _e(l)) {
        const { propsDefaults: h } = i;
        if (n in h)
          s = h[n];
        else {
          const c = Xs(i);
          s = h[n] = l.call(
            null,
            t
          ), c();
        }
      } else
        s = l;
      i.ce && i.ce._setProp(n, s);
    }
    o[
      0
      /* shouldCast */
    ] && (r && !a ? s = !1 : o[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === Fn(n)) && (s = !0));
  }
  return s;
}
const Ff = /* @__PURE__ */ new WeakMap();
function Yl(e, t, n = !1) {
  const s = n ? Ff : t.propsCache, i = s.get(e);
  if (i)
    return i;
  const r = e.props, o = {}, a = [];
  let l = !1;
  if (!_e(e)) {
    const c = (w) => {
      l = !0;
      const [m, P] = Yl(w, t, !0);
      wt(o, m), P && a.push(...P);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!r && !l)
    return at(e) && s.set(e, ns), ns;
  if (pe(r))
    for (let c = 0; c < r.length; c++) {
      const w = On(r[c]);
      ga(w) && (o[w] = st);
    }
  else if (r)
    for (const c in r) {
      const w = On(c);
      if (ga(w)) {
        const m = r[c], P = o[w] = pe(m) || _e(m) ? { type: m } : wt({}, m), M = P.type;
        let K = !1, Pe = !0;
        if (pe(M))
          for (let fe = 0; fe < M.length; ++fe) {
            const ge = M[fe], ve = _e(ge) && ge.name;
            if (ve === "Boolean") {
              K = !0;
              break;
            } else ve === "String" && (Pe = !1);
          }
        else
          K = _e(M) && M.name === "Boolean";
        P[
          0
          /* shouldCast */
        ] = K, P[
          1
          /* shouldCastTrue */
        ] = Pe, (K || Ke(P, "default")) && a.push(w);
      }
    }
  const h = [o, a];
  return at(e) && s.set(e, h), h;
}
function ga(e) {
  return e[0] !== "$" && !Ps(e);
}
const _o = (e) => e === "_" || e === "__" || e === "_ctx" || e === "$stable", yo = (e) => pe(e) ? e.map(rn) : [rn(e)], Df = (e, t, n) => {
  if (t._n)
    return t;
  const s = ff((...i) => yo(t(...i)), n);
  return s._c = !1, s;
}, Xl = (e, t, n) => {
  const s = e._ctx;
  for (const i in e) {
    if (_o(i)) continue;
    const r = e[i];
    if (_e(r))
      t[i] = Df(i, r, s);
    else if (r != null) {
      const o = yo(r);
      t[i] = () => o;
    }
  }
}, Zl = (e, t) => {
  const n = yo(t);
  e.slots.default = () => n;
}, Jl = (e, t, n) => {
  for (const s in t)
    (n || !_o(s)) && (e[s] = t[s]);
}, Bf = (e, t, n) => {
  const s = e.slots = Vl();
  if (e.vnode.shapeFlag & 32) {
    const i = t.__;
    i && Pr(s, "__", i, !0);
    const r = t._;
    r ? (Jl(s, t, n), n && Pr(s, "_", r, !0)) : Xl(t, s);
  } else t && Zl(e, t);
}, $f = (e, t, n) => {
  const { vnode: s, slots: i } = e;
  let r = !0, o = st;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? r = !1 : Jl(i, t, n) : (r = !t.$stable, Xl(t, i)), o = t;
  } else t && (Zl(e, t), o = { default: 1 });
  if (r)
    for (const a in i)
      !_o(a) && o[a] == null && delete i[a];
}, Bt = Qf;
function Uf(e) {
  return zf(e);
}
function zf(e, t) {
  const n = Wi();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: i,
    patchProp: r,
    createElement: o,
    createText: a,
    createComment: l,
    setText: h,
    setElementText: c,
    parentNode: w,
    nextSibling: m,
    setScopeId: P = on,
    insertStaticContent: M
  } = e, K = (p, y, x, F = null, L = null, R = null, U = void 0, z = null, $ = !!y.dynamicChildren) => {
    if (p === y)
      return;
    p && !vs(p, y) && (F = Ne(p), Me(p, L, R, !0), p = null), y.patchFlag === -2 && ($ = !1, y.dynamicChildren = null);
    const { type: D, ref: J, shapeFlag: H } = y;
    switch (D) {
      case Zi:
        Pe(p, y, x, F);
        break;
      case Pn:
        fe(p, y, x, F);
        break;
      case yi:
        p == null && ge(y, x, F, U);
        break;
      case $e:
        ye(
          p,
          y,
          x,
          F,
          L,
          R,
          U,
          z,
          $
        );
        break;
      default:
        H & 1 ? I(
          p,
          y,
          x,
          F,
          L,
          R,
          U,
          z,
          $
        ) : H & 6 ? Qe(
          p,
          y,
          x,
          F,
          L,
          R,
          U,
          z,
          $
        ) : (H & 64 || H & 128) && D.process(
          p,
          y,
          x,
          F,
          L,
          R,
          U,
          z,
          $,
          V
        );
    }
    J != null && L ? Ds(J, p && p.ref, R, y || p, !y) : J == null && p && p.ref != null && Ds(p.ref, null, R, p, !0);
  }, Pe = (p, y, x, F) => {
    if (p == null)
      s(
        y.el = a(y.children),
        x,
        F
      );
    else {
      const L = y.el = p.el;
      y.children !== p.children && h(L, y.children);
    }
  }, fe = (p, y, x, F) => {
    p == null ? s(
      y.el = l(y.children || ""),
      x,
      F
    ) : y.el = p.el;
  }, ge = (p, y, x, F) => {
    [p.el, p.anchor] = M(
      p.children,
      y,
      x,
      F,
      p.el,
      p.anchor
    );
  }, ve = ({ el: p, anchor: y }, x, F) => {
    let L;
    for (; p && p !== y; )
      L = m(p), s(p, x, F), p = L;
    s(y, x, F);
  }, T = ({ el: p, anchor: y }) => {
    let x;
    for (; p && p !== y; )
      x = m(p), i(p), p = x;
    i(y);
  }, I = (p, y, x, F, L, R, U, z, $) => {
    y.type === "svg" ? U = "svg" : y.type === "math" && (U = "mathml"), p == null ? j(
      y,
      x,
      F,
      L,
      R,
      U,
      z,
      $
    ) : ze(
      p,
      y,
      L,
      R,
      U,
      z,
      $
    );
  }, j = (p, y, x, F, L, R, U, z) => {
    let $, D;
    const { props: J, shapeFlag: H, transition: Z, dirs: te } = p;
    if ($ = p.el = o(
      p.type,
      R,
      J && J.is,
      J
    ), H & 8 ? c($, p.children) : H & 16 && Ae(
      p.children,
      $,
      null,
      F,
      L,
      br(p, R),
      U,
      z
    ), te && $n(p, null, F, "created"), G($, p, p.scopeId, U, F), J) {
      for (const me in J)
        me !== "value" && !Ps(me) && r($, me, null, J[me], R, F);
      "value" in J && r($, "value", null, J.value, R), (D = J.onVnodeBeforeMount) && tn(D, F, p);
    }
    te && $n(p, null, F, "beforeMount");
    const re = Hf(L, Z);
    re && Z.beforeEnter($), s($, y, x), ((D = J && J.onVnodeMounted) || re || te) && Bt(() => {
      D && tn(D, F, p), re && Z.enter($), te && $n(p, null, F, "mounted");
    }, L);
  }, G = (p, y, x, F, L) => {
    if (x && P(p, x), F)
      for (let R = 0; R < F.length; R++)
        P(p, F[R]);
    if (L) {
      let R = L.subTree;
      if (y === R || ic(R.type) && (R.ssContent === y || R.ssFallback === y)) {
        const U = L.vnode;
        G(
          p,
          U,
          U.scopeId,
          U.slotScopeIds,
          L.parent
        );
      }
    }
  }, Ae = (p, y, x, F, L, R, U, z, $ = 0) => {
    for (let D = $; D < p.length; D++) {
      const J = p[D] = z ? Rn(p[D]) : rn(p[D]);
      K(
        null,
        J,
        y,
        x,
        F,
        L,
        R,
        U,
        z
      );
    }
  }, ze = (p, y, x, F, L, R, U) => {
    const z = y.el = p.el;
    let { patchFlag: $, dynamicChildren: D, dirs: J } = y;
    $ |= p.patchFlag & 16;
    const H = p.props || st, Z = y.props || st;
    let te;
    if (x && Un(x, !1), (te = Z.onVnodeBeforeUpdate) && tn(te, x, y, p), J && $n(y, p, x, "beforeUpdate"), x && Un(x, !0), (H.innerHTML && Z.innerHTML == null || H.textContent && Z.textContent == null) && c(z, ""), D ? Ze(
      p.dynamicChildren,
      D,
      z,
      x,
      F,
      br(y, L),
      R
    ) : U || ae(
      p,
      y,
      z,
      null,
      x,
      F,
      br(y, L),
      R,
      !1
    ), $ > 0) {
      if ($ & 16)
        Re(z, H, Z, x, L);
      else if ($ & 2 && H.class !== Z.class && r(z, "class", null, Z.class, L), $ & 4 && r(z, "style", H.style, Z.style, L), $ & 8) {
        const re = y.dynamicProps;
        for (let me = 0; me < re.length; me++) {
          const Te = re[me], Fe = H[Te], Ye = Z[Te];
          (Ye !== Fe || Te === "value") && r(z, Te, Fe, Ye, L, x);
        }
      }
      $ & 1 && p.children !== y.children && c(z, y.children);
    } else !U && D == null && Re(z, H, Z, x, L);
    ((te = Z.onVnodeUpdated) || J) && Bt(() => {
      te && tn(te, x, y, p), J && $n(y, p, x, "updated");
    }, F);
  }, Ze = (p, y, x, F, L, R, U) => {
    for (let z = 0; z < y.length; z++) {
      const $ = p[z], D = y[z], J = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        $.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        ($.type === $e || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !vs($, D) || // - In the case of a component, it could contain anything.
        $.shapeFlag & 198) ? w($.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          x
        )
      );
      K(
        $,
        D,
        J,
        null,
        F,
        L,
        R,
        U,
        !0
      );
    }
  }, Re = (p, y, x, F, L) => {
    if (y !== x) {
      if (y !== st)
        for (const R in y)
          !Ps(R) && !(R in x) && r(
            p,
            R,
            y[R],
            null,
            L,
            F
          );
      for (const R in x) {
        if (Ps(R)) continue;
        const U = x[R], z = y[R];
        U !== z && R !== "value" && r(p, R, z, U, L, F);
      }
      "value" in x && r(p, "value", y.value, x.value, L);
    }
  }, ye = (p, y, x, F, L, R, U, z, $) => {
    const D = y.el = p ? p.el : a(""), J = y.anchor = p ? p.anchor : a("");
    let { patchFlag: H, dynamicChildren: Z, slotScopeIds: te } = y;
    te && (z = z ? z.concat(te) : te), p == null ? (s(D, x, F), s(J, x, F), Ae(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      y.children || [],
      x,
      J,
      L,
      R,
      U,
      z,
      $
    )) : H > 0 && H & 64 && Z && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    p.dynamicChildren ? (Ze(
      p.dynamicChildren,
      Z,
      x,
      L,
      R,
      U,
      z
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (y.key != null || L && y === L.subTree) && Ql(
      p,
      y,
      !0
      /* shallow */
    )) : ae(
      p,
      y,
      x,
      J,
      L,
      R,
      U,
      z,
      $
    );
  }, Qe = (p, y, x, F, L, R, U, z, $) => {
    y.slotScopeIds = z, p == null ? y.shapeFlag & 512 ? L.ctx.activate(
      y,
      x,
      F,
      U,
      $
    ) : it(
      y,
      x,
      F,
      L,
      R,
      U,
      $
    ) : lt(p, y, $);
  }, it = (p, y, x, F, L, R, U) => {
    const z = p.component = oh(
      p,
      F,
      L
    );
    if ($l(p) && (z.ctx.renderer = V), lh(z, !1, U), z.asyncDep) {
      if (L && L.registerDep(z, ue, U), !p.el) {
        const $ = z.subTree = an(Pn);
        fe(null, $, y, x), p.placeholder = $.el;
      }
    } else
      ue(
        z,
        p,
        y,
        x,
        L,
        R,
        U
      );
  }, lt = (p, y, x) => {
    const F = y.component = p.component;
    if (Zf(p, y, x))
      if (F.asyncDep && !F.asyncResolved) {
        de(F, y, x);
        return;
      } else
        F.next = y, F.update();
    else
      y.el = p.el, F.vnode = y;
  }, ue = (p, y, x, F, L, R, U) => {
    const z = () => {
      if (p.isMounted) {
        let { next: H, bu: Z, u: te, parent: re, vnode: me } = p;
        {
          const f = ec(p);
          if (f) {
            H && (H.el = me.el, de(p, H, U)), f.asyncDep.then(() => {
              p.isUnmounted || z();
            });
            return;
          }
        }
        let Te = H, Fe;
        Un(p, !1), H ? (H.el = me.el, de(p, H, U)) : H = me, Z && mi(Z), (Fe = H.props && H.props.onVnodeBeforeUpdate) && tn(Fe, re, H, me), Un(p, !0);
        const Ye = _a(p), ht = p.subTree;
        p.subTree = Ye, K(
          ht,
          Ye,
          // parent may have changed if it's in a teleport
          w(ht.el),
          // anchor may have changed if it's in a fragment
          Ne(ht),
          p,
          L,
          R
        ), H.el = Ye.el, Te === null && Jf(p, Ye.el), te && Bt(te, L), (Fe = H.props && H.props.onVnodeUpdated) && Bt(
          () => tn(Fe, re, H, me),
          L
        );
      } else {
        let H;
        const { el: Z, props: te } = y, { bm: re, m: me, parent: Te, root: Fe, type: Ye } = p, ht = Bs(y);
        Un(p, !1), re && mi(re), !ht && (H = te && te.onVnodeBeforeMount) && tn(H, Te, y), Un(p, !0);
        {
          Fe.ce && // @ts-expect-error _def is private
          Fe.ce._def.shadowRoot !== !1 && Fe.ce._injectChildStyle(Ye);
          const f = p.subTree = _a(p);
          K(
            null,
            f,
            x,
            F,
            p,
            L,
            R
          ), y.el = f.el;
        }
        if (me && Bt(me, L), !ht && (H = te && te.onVnodeMounted)) {
          const f = y;
          Bt(
            () => tn(H, Te, f),
            L
          );
        }
        (y.shapeFlag & 256 || Te && Bs(Te.vnode) && Te.vnode.shapeFlag & 256) && p.a && Bt(p.a, L), p.isMounted = !0, y = x = F = null;
      }
    };
    p.scope.on();
    const $ = p.effect = new ml(z);
    p.scope.off();
    const D = p.update = $.run.bind($), J = p.job = $.runIfDirty.bind($);
    J.i = p, J.id = p.uid, $.scheduler = () => go(J), Un(p, !0), D();
  }, de = (p, y, x) => {
    y.component = p;
    const F = p.vnode.props;
    p.vnode = y, p.next = null, Mf(p, y.props, F, x), $f(p, y.children, x), bn(), ua(p), wn();
  }, ae = (p, y, x, F, L, R, U, z, $ = !1) => {
    const D = p && p.children, J = p ? p.shapeFlag : 0, H = y.children, { patchFlag: Z, shapeFlag: te } = y;
    if (Z > 0) {
      if (Z & 128) {
        rt(
          D,
          H,
          x,
          F,
          L,
          R,
          U,
          z,
          $
        );
        return;
      } else if (Z & 256) {
        Se(
          D,
          H,
          x,
          F,
          L,
          R,
          U,
          z,
          $
        );
        return;
      }
    }
    te & 8 ? (J & 16 && q(D, L, R), H !== D && c(x, H)) : J & 16 ? te & 16 ? rt(
      D,
      H,
      x,
      F,
      L,
      R,
      U,
      z,
      $
    ) : q(D, L, R, !0) : (J & 8 && c(x, ""), te & 16 && Ae(
      H,
      x,
      F,
      L,
      R,
      U,
      z,
      $
    ));
  }, Se = (p, y, x, F, L, R, U, z, $) => {
    p = p || ns, y = y || ns;
    const D = p.length, J = y.length, H = Math.min(D, J);
    let Z;
    for (Z = 0; Z < H; Z++) {
      const te = y[Z] = $ ? Rn(y[Z]) : rn(y[Z]);
      K(
        p[Z],
        te,
        x,
        null,
        L,
        R,
        U,
        z,
        $
      );
    }
    D > J ? q(
      p,
      L,
      R,
      !0,
      !1,
      H
    ) : Ae(
      y,
      x,
      F,
      L,
      R,
      U,
      z,
      $,
      H
    );
  }, rt = (p, y, x, F, L, R, U, z, $) => {
    let D = 0;
    const J = y.length;
    let H = p.length - 1, Z = J - 1;
    for (; D <= H && D <= Z; ) {
      const te = p[D], re = y[D] = $ ? Rn(y[D]) : rn(y[D]);
      if (vs(te, re))
        K(
          te,
          re,
          x,
          null,
          L,
          R,
          U,
          z,
          $
        );
      else
        break;
      D++;
    }
    for (; D <= H && D <= Z; ) {
      const te = p[H], re = y[Z] = $ ? Rn(y[Z]) : rn(y[Z]);
      if (vs(te, re))
        K(
          te,
          re,
          x,
          null,
          L,
          R,
          U,
          z,
          $
        );
      else
        break;
      H--, Z--;
    }
    if (D > H) {
      if (D <= Z) {
        const te = Z + 1, re = te < J ? y[te].el : F;
        for (; D <= Z; )
          K(
            null,
            y[D] = $ ? Rn(y[D]) : rn(y[D]),
            x,
            re,
            L,
            R,
            U,
            z,
            $
          ), D++;
      }
    } else if (D > Z)
      for (; D <= H; )
        Me(p[D], L, R, !0), D++;
    else {
      const te = D, re = D, me = /* @__PURE__ */ new Map();
      for (D = re; D <= Z; D++) {
        const S = y[D] = $ ? Rn(y[D]) : rn(y[D]);
        S.key != null && me.set(S.key, D);
      }
      let Te, Fe = 0;
      const Ye = Z - re + 1;
      let ht = !1, f = 0;
      const v = new Array(Ye);
      for (D = 0; D < Ye; D++) v[D] = 0;
      for (D = te; D <= H; D++) {
        const S = p[D];
        if (Fe >= Ye) {
          Me(S, L, R, !0);
          continue;
        }
        let B;
        if (S.key != null)
          B = me.get(S.key);
        else
          for (Te = re; Te <= Z; Te++)
            if (v[Te - re] === 0 && vs(S, y[Te])) {
              B = Te;
              break;
            }
        B === void 0 ? Me(S, L, R, !0) : (v[B - re] = D + 1, B >= f ? f = B : ht = !0, K(
          S,
          y[B],
          x,
          null,
          L,
          R,
          U,
          z,
          $
        ), Fe++);
      }
      const C = ht ? qf(v) : ns;
      for (Te = C.length - 1, D = Ye - 1; D >= 0; D--) {
        const S = re + D, B = y[S], Y = y[S + 1], ne = S + 1 < J ? (
          // #13559, fallback to el placeholder for unresolved async component
          Y.el || Y.placeholder
        ) : F;
        v[D] === 0 ? K(
          null,
          B,
          x,
          ne,
          L,
          R,
          U,
          z,
          $
        ) : ht && (Te < 0 || D !== C[Te] ? oe(B, x, ne, 2) : Te--);
      }
    }
  }, oe = (p, y, x, F, L = null) => {
    const { el: R, type: U, transition: z, children: $, shapeFlag: D } = p;
    if (D & 6) {
      oe(p.component.subTree, y, x, F);
      return;
    }
    if (D & 128) {
      p.suspense.move(y, x, F);
      return;
    }
    if (D & 64) {
      U.move(p, y, x, V);
      return;
    }
    if (U === $e) {
      s(R, y, x);
      for (let H = 0; H < $.length; H++)
        oe($[H], y, x, F);
      s(p.anchor, y, x);
      return;
    }
    if (U === yi) {
      ve(p, y, x);
      return;
    }
    if (F !== 2 && D & 1 && z)
      if (F === 0)
        z.beforeEnter(R), s(R, y, x), Bt(() => z.enter(R), L);
      else {
        const { leave: H, delayLeave: Z, afterLeave: te } = z, re = () => {
          p.ctx.isUnmounted ? i(R) : s(R, y, x);
        }, me = () => {
          H(R, () => {
            re(), te && te();
          });
        };
        Z ? Z(R, re, me) : me();
      }
    else
      s(R, y, x);
  }, Me = (p, y, x, F = !1, L = !1) => {
    const {
      type: R,
      props: U,
      ref: z,
      children: $,
      dynamicChildren: D,
      shapeFlag: J,
      patchFlag: H,
      dirs: Z,
      cacheIndex: te
    } = p;
    if (H === -2 && (L = !1), z != null && (bn(), Ds(z, null, x, p, !0), wn()), te != null && (y.renderCache[te] = void 0), J & 256) {
      y.ctx.deactivate(p);
      return;
    }
    const re = J & 1 && Z, me = !Bs(p);
    let Te;
    if (me && (Te = U && U.onVnodeBeforeUnmount) && tn(Te, y, p), J & 6)
      Ie(p.component, x, F);
    else {
      if (J & 128) {
        p.suspense.unmount(x, F);
        return;
      }
      re && $n(p, null, y, "beforeUnmount"), J & 64 ? p.type.remove(
        p,
        y,
        x,
        V,
        F
      ) : D && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !D.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (R !== $e || H > 0 && H & 64) ? q(
        D,
        y,
        x,
        !1,
        !0
      ) : (R === $e && H & 384 || !L && J & 16) && q($, y, x), F && De(p);
    }
    (me && (Te = U && U.onVnodeUnmounted) || re) && Bt(() => {
      Te && tn(Te, y, p), re && $n(p, null, y, "unmounted");
    }, x);
  }, De = (p) => {
    const { type: y, el: x, anchor: F, transition: L } = p;
    if (y === $e) {
      yt(x, F);
      return;
    }
    if (y === yi) {
      T(p);
      return;
    }
    const R = () => {
      i(x), L && !L.persisted && L.afterLeave && L.afterLeave();
    };
    if (p.shapeFlag & 1 && L && !L.persisted) {
      const { leave: U, delayLeave: z } = L, $ = () => U(x, R);
      z ? z(p.el, R, $) : $();
    } else
      R();
  }, yt = (p, y) => {
    let x;
    for (; p !== y; )
      x = m(p), i(p), p = x;
    i(y);
  }, Ie = (p, y, x) => {
    const {
      bum: F,
      scope: L,
      job: R,
      subTree: U,
      um: z,
      m: $,
      a: D,
      parent: J,
      slots: { __: H }
    } = p;
    ma($), ma(D), F && mi(F), J && pe(H) && H.forEach((Z) => {
      J.renderCache[Z] = void 0;
    }), L.stop(), R && (R.flags |= 8, Me(U, p, y, x)), z && Bt(z, y), Bt(() => {
      p.isUnmounted = !0;
    }, y), y && y.pendingBranch && !y.isUnmounted && p.asyncDep && !p.asyncResolved && p.suspenseId === y.pendingId && (y.deps--, y.deps === 0 && y.resolve());
  }, q = (p, y, x, F = !1, L = !1, R = 0) => {
    for (let U = R; U < p.length; U++)
      Me(p[U], y, x, F, L);
  }, Ne = (p) => {
    if (p.shapeFlag & 6)
      return Ne(p.component.subTree);
    if (p.shapeFlag & 128)
      return p.suspense.next();
    const y = m(p.anchor || p.el), x = y && y[hf];
    return x ? m(x) : y;
  };
  let le = !1;
  const Le = (p, y, x) => {
    p == null ? y._vnode && Me(y._vnode, null, null, !0) : K(
      y._vnode || null,
      p,
      y,
      null,
      null,
      null,
      x
    ), y._vnode = p, le || (le = !0, ua(), Pl(), le = !1);
  }, V = {
    p: K,
    um: Me,
    m: oe,
    r: De,
    mt: it,
    mc: Ae,
    pc: ae,
    pbc: Ze,
    n: Ne,
    o: e
  };
  return {
    render: Le,
    hydrate: void 0,
    createApp: Of(Le)
  };
}
function br({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Un({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Hf(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Ql(e, t, n = !1) {
  const s = e.children, i = t.children;
  if (pe(s) && pe(i))
    for (let r = 0; r < s.length; r++) {
      const o = s[r];
      let a = i[r];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[r] = Rn(i[r]), a.el = o.el), !n && a.patchFlag !== -2 && Ql(o, a)), a.type === Zi && (a.el = o.el), a.type === Pn && !a.el && (a.el = o.el);
    }
}
function qf(e) {
  const t = e.slice(), n = [0];
  let s, i, r, o, a;
  const l = e.length;
  for (s = 0; s < l; s++) {
    const h = e[s];
    if (h !== 0) {
      if (i = n[n.length - 1], e[i] < h) {
        t[s] = i, n.push(s);
        continue;
      }
      for (r = 0, o = n.length - 1; r < o; )
        a = r + o >> 1, e[n[a]] < h ? r = a + 1 : o = a;
      h < e[n[r]] && (r > 0 && (t[s] = n[r - 1]), n[r] = s);
    }
  }
  for (r = n.length, o = n[r - 1]; r-- > 0; )
    n[r] = o, o = t[o];
  return n;
}
function ec(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : ec(t);
}
function ma(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
const Wf = Symbol.for("v-scx"), jf = () => _i(Wf);
function Wt(e, t, n) {
  return tc(e, t, n);
}
function tc(e, t, n = st) {
  const { immediate: s, deep: i, flush: r, once: o } = n, a = wt({}, n), l = t && s || !t && r !== "post";
  let h;
  if (Vs) {
    if (r === "sync") {
      const P = jf();
      h = P.__watcherHandles || (P.__watcherHandles = []);
    } else if (!l) {
      const P = () => {
      };
      return P.stop = on, P.resume = on, P.pause = on, P;
    }
  }
  const c = Ct;
  a.call = (P, M, K) => cn(P, c, M, K);
  let w = !1;
  r === "post" ? a.scheduler = (P) => {
    Bt(P, c && c.suspense);
  } : r !== "sync" && (w = !0, a.scheduler = (P, M) => {
    M ? P() : go(P);
  }), a.augmentJob = (P) => {
    t && (P.flags |= 4), w && (P.flags |= 2, c && (P.id = c.uid, P.i = c));
  };
  const m = af(e, t, a);
  return Vs && (h ? h.push(m) : l && m()), m;
}
function Vf(e, t, n) {
  const s = this.proxy, i = ft(e) ? e.includes(".") ? nc(s, e) : () => s[e] : e.bind(s, s);
  let r;
  _e(t) ? r = t : (r = t.handler, n = t);
  const o = Xs(this), a = tc(i, r.bind(s), n);
  return o(), a;
}
function nc(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let i = 0; i < n.length && s; i++)
      s = s[n[i]];
    return s;
  };
}
const Kf = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${On(t)}Modifiers`] || e[`${Fn(t)}Modifiers`];
function Gf(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || st;
  let i = n;
  const r = t.startsWith("update:"), o = r && Kf(s, t.slice(7));
  o && (o.trim && (i = n.map((c) => ft(c) ? c.trim() : c)), o.number && (i = n.map(Mr)));
  let a, l = s[a = pr(t)] || // also try camelCase event handler (#2249)
  s[a = pr(On(t))];
  !l && r && (l = s[a = pr(Fn(t))]), l && cn(
    l,
    e,
    6,
    i
  );
  const h = s[a + "Once"];
  if (h) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, cn(
      h,
      e,
      6,
      i
    );
  }
}
function sc(e, t, n = !1) {
  const s = t.emitsCache, i = s.get(e);
  if (i !== void 0)
    return i;
  const r = e.emits;
  let o = {}, a = !1;
  if (!_e(e)) {
    const l = (h) => {
      const c = sc(h, t, !0);
      c && (a = !0, wt(o, c));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !r && !a ? (at(e) && s.set(e, null), null) : (pe(r) ? r.forEach((l) => o[l] = null) : wt(o, r), at(e) && s.set(e, o), o);
}
function Xi(e, t) {
  return !e || !zi(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), Ke(e, t[0].toLowerCase() + t.slice(1)) || Ke(e, Fn(t)) || Ke(e, t));
}
function _a(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: i,
    propsOptions: [r],
    slots: o,
    attrs: a,
    emit: l,
    render: h,
    renderCache: c,
    props: w,
    data: m,
    setupState: P,
    ctx: M,
    inheritAttrs: K
  } = e, Pe = Ni(e);
  let fe, ge;
  try {
    if (n.shapeFlag & 4) {
      const T = i || s, I = T;
      fe = rn(
        h.call(
          I,
          T,
          c,
          w,
          P,
          m,
          M
        )
      ), ge = a;
    } else {
      const T = t;
      fe = rn(
        T.length > 1 ? T(
          w,
          { attrs: a, slots: o, emit: l }
        ) : T(
          w,
          null
        )
      ), ge = t.props ? a : Yf(a);
    }
  } catch (T) {
    Us.length = 0, Ki(T, e, 1), fe = an(Pn);
  }
  let ve = fe;
  if (ge && K !== !1) {
    const T = Object.keys(ge), { shapeFlag: I } = ve;
    T.length && I & 7 && (r && T.some(io) && (ge = Xf(
      ge,
      r
    )), ve = cs(ve, ge, !1, !0));
  }
  return n.dirs && (ve = cs(ve, null, !1, !0), ve.dirs = ve.dirs ? ve.dirs.concat(n.dirs) : n.dirs), n.transition && mo(ve, n.transition), fe = ve, Ni(Pe), fe;
}
const Yf = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || zi(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Xf = (e, t) => {
  const n = {};
  for (const s in e)
    (!io(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Zf(e, t, n) {
  const { props: s, children: i, component: r } = e, { props: o, children: a, patchFlag: l } = t, h = r.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? ya(s, o, h) : !!o;
    if (l & 8) {
      const c = t.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        const m = c[w];
        if (o[m] !== s[m] && !Xi(h, m))
          return !0;
      }
    }
  } else
    return (i || a) && (!a || !a.$stable) ? !0 : s === o ? !1 : s ? o ? ya(s, o, h) : !0 : !!o;
  return !1;
}
function ya(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let i = 0; i < s.length; i++) {
    const r = s[i];
    if (t[r] !== e[r] && !Xi(n, r))
      return !0;
  }
  return !1;
}
function Jf({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const s = t.subTree;
    if (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const ic = (e) => e.__isSuspense;
function Qf(e, t) {
  t && t.pendingBranch ? pe(e) ? t.effects.push(...e) : t.effects.push(e) : uf(e);
}
const $e = Symbol.for("v-fgt"), Zi = Symbol.for("v-txt"), Pn = Symbol.for("v-cmt"), yi = Symbol.for("v-stc"), Us = [];
let $t = null;
function k(e = !1) {
  Us.push($t = e ? null : []);
}
function eh() {
  Us.pop(), $t = Us[Us.length - 1] || null;
}
let js = 1;
function va(e, t = !1) {
  js += e, e < 0 && $t && t && ($t.hasOnce = !0);
}
function rc(e) {
  return e.dynamicChildren = js > 0 ? $t || ns : null, eh(), js > 0 && $t && $t.push(e), e;
}
function A(e, t, n, s, i, r) {
  return rc(
    b(
      e,
      t,
      n,
      s,
      i,
      r,
      !0
    )
  );
}
function oc(e, t, n, s, i) {
  return rc(
    an(
      e,
      t,
      n,
      s,
      i,
      !0
    )
  );
}
function ac(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function vs(e, t) {
  return e.type === t.type && e.key === t.key;
}
const lc = ({ key: e }) => e ?? null, vi = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ft(e) || bt(e) || _e(e) ? { i: jt, r: e, k: t, f: !!n } : e : null);
function b(e, t = null, n = null, s = 0, i = null, r = e === $e ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && lc(t),
    ref: t && vi(t),
    scopeId: Fl,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: r,
    patchFlag: s,
    dynamicProps: i,
    dynamicChildren: null,
    appContext: null,
    ctx: jt
  };
  return a ? (vo(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= ft(n) ? 8 : 16), js > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  $t && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && $t.push(l), l;
}
const an = th;
function th(e, t = null, n = null, s = 0, i = null, r = !1) {
  if ((!e || e === Af) && (e = Pn), ac(e)) {
    const a = cs(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && vo(a, n), js > 0 && !r && $t && (a.shapeFlag & 6 ? $t[$t.indexOf(e)] = a : $t.push(a)), a.patchFlag = -2, a;
  }
  if (hh(e) && (e = e.__vccOpts), t) {
    t = nh(t);
    let { class: a, style: l } = t;
    a && !ft(a) && (t.class = je(a)), at(l) && (po(l) && !pe(l) && (l = wt({}, l)), t.style = xe(l));
  }
  const o = ft(e) ? 1 : ic(e) ? 128 : df(e) ? 64 : at(e) ? 4 : _e(e) ? 2 : 0;
  return b(
    e,
    t,
    n,
    s,
    i,
    o,
    r,
    !0
  );
}
function nh(e) {
  return e ? po(e) || Kl(e) ? wt({}, e) : e : null;
}
function cs(e, t, n = !1, s = !1) {
  const { props: i, ref: r, patchFlag: o, children: a, transition: l } = e, h = t ? sh(i || {}, t) : i, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: h,
    key: h && lc(h),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? pe(r) ? r.concat(vi(t)) : [r, vi(t)] : vi(t)
    ) : r,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== $e ? o === -1 ? 16 : o | 16 : o,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: l,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && cs(e.ssContent),
    ssFallback: e.ssFallback && cs(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return l && s && mo(
    c,
    l.clone(c)
  ), c;
}
function dn(e = " ", t = 0) {
  return an(Zi, null, e, t);
}
function zn(e, t) {
  const n = an(yi, null, e);
  return n.staticCount = t, n;
}
function se(e = "", t = !1) {
  return t ? (k(), oc(Pn, null, e)) : an(Pn, null, e);
}
function rn(e) {
  return e == null || typeof e == "boolean" ? an(Pn) : pe(e) ? an(
    $e,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : ac(e) ? Rn(e) : an(Zi, null, String(e));
}
function Rn(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : cs(e);
}
function vo(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (pe(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), vo(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = t._;
      !i && !Kl(t) ? t._ctx = jt : i === 3 && jt && (jt.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else _e(t) ? (t = { default: t, _ctx: jt }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [dn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function sh(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const i in s)
      if (i === "class")
        t.class !== s.class && (t.class = je([t.class, s.class]));
      else if (i === "style")
        t.style = xe([t.style, s.style]);
      else if (zi(i)) {
        const r = t[i], o = s[i];
        o && r !== o && !(pe(r) && r.includes(o)) && (t[i] = r ? [].concat(r, o) : o);
      } else i !== "" && (t[i] = s[i]);
  }
  return t;
}
function tn(e, t, n, s = null) {
  cn(e, t, 7, [
    n,
    s
  ]);
}
const ih = Wl();
let rh = 0;
function oh(e, t, n) {
  const s = e.type, i = (t ? t.appContext : e.appContext) || ih, r = {
    uid: rh++,
    vnode: e,
    type: s,
    parent: t,
    appContext: i,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Ou(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(i.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: Yl(s, i),
    emitsOptions: sc(s, i),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: st,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: st,
    data: st,
    props: st,
    attrs: st,
    slots: st,
    refs: st,
    setupState: st,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = Gf.bind(null, r), e.ce && e.ce(r), r;
}
let Ct = null;
const ah = () => Ct || jt;
let Mi, Wr;
{
  const e = Wi(), t = (n, s) => {
    let i;
    return (i = e[n]) || (i = e[n] = []), i.push(s), (r) => {
      i.length > 1 ? i.forEach((o) => o(r)) : i[0](r);
    };
  };
  Mi = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ct = n
  ), Wr = t(
    "__VUE_SSR_SETTERS__",
    (n) => Vs = n
  );
}
const Xs = (e) => {
  const t = Ct;
  return Mi(e), e.scope.on(), () => {
    e.scope.off(), Mi(t);
  };
}, ba = () => {
  Ct && Ct.scope.off(), Mi(null);
};
function cc(e) {
  return e.vnode.shapeFlag & 4;
}
let Vs = !1;
function lh(e, t = !1, n = !1) {
  t && Wr(t);
  const { props: s, children: i } = e.vnode, r = cc(e);
  Pf(e, s, r, t), Bf(e, i, n || t);
  const o = r ? ch(e, t) : void 0;
  return t && Wr(!1), o;
}
function ch(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Tf);
  const { setup: s } = n;
  if (s) {
    bn();
    const i = e.setupContext = s.length > 1 ? fh(e) : null, r = Xs(e), o = Gs(
      s,
      e,
      0,
      [
        e.props,
        i
      ]
    ), a = cl(o);
    if (wn(), r(), (a || e.sp) && !Bs(e) && Bl(e), a) {
      if (o.then(ba, ba), t)
        return o.then((l) => {
          wa(e, l);
        }).catch((l) => {
          Ki(l, e, 0);
        });
      e.asyncDep = o;
    } else
      wa(e, o);
  } else
    uc(e);
}
function wa(e, t, n) {
  _e(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : at(t) && (e.setupState = Ll(t)), uc(e);
}
function uc(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || on);
  {
    const i = Xs(e);
    bn();
    try {
      Sf(e);
    } finally {
      wn(), i();
    }
  }
}
const uh = {
  get(e, t) {
    return vt(e, "get", ""), e[t];
  }
};
function fh(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, uh),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Ji(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Ll(Qu(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in $s)
        return $s[n](e);
    },
    has(t, n) {
      return n in t || n in $s;
    }
  })) : e.proxy;
}
function hh(e) {
  return _e(e) && "__vccOpts" in e;
}
const ce = (e, t) => rf(e, t, Vs), dh = "3.5.18";
/**
* @vue/runtime-dom v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let jr;
const ka = typeof window < "u" && window.trustedTypes;
if (ka)
  try {
    jr = /* @__PURE__ */ ka.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const fc = jr ? (e) => jr.createHTML(e) : (e) => e, ph = "http://www.w3.org/2000/svg", gh = "http://www.w3.org/1998/Math/MathML", gn = typeof document < "u" ? document : null, xa = gn && /* @__PURE__ */ gn.createElement("template"), mh = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const i = t === "svg" ? gn.createElementNS(ph, e) : t === "mathml" ? gn.createElementNS(gh, e) : n ? gn.createElement(e, { is: n }) : gn.createElement(e);
    return e === "select" && s && s.multiple != null && i.setAttribute("multiple", s.multiple), i;
  },
  createText: (e) => gn.createTextNode(e),
  createComment: (e) => gn.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => gn.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, i, r) {
    const o = n ? n.previousSibling : t.lastChild;
    if (i && (i === r || i.nextSibling))
      for (; t.insertBefore(i.cloneNode(!0), n), !(i === r || !(i = i.nextSibling)); )
        ;
    else {
      xa.innerHTML = fc(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = xa.content;
      if (s === "svg" || s === "mathml") {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      o ? o.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, _h = Symbol("_vtc");
function yh(e, t, n) {
  const s = e[_h];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Fi = Symbol("_vod"), hc = Symbol("_vsh"), vh = {
  beforeMount(e, { value: t }, { transition: n }) {
    e[Fi] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : bs(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), bs(e, !0), s.enter(e)) : s.leave(e, () => {
      bs(e, !1);
    }) : bs(e, t));
  },
  beforeUnmount(e, { value: t }) {
    bs(e, t);
  }
};
function bs(e, t) {
  e.style.display = t ? e[Fi] : "none", e[hc] = !t;
}
const bh = Symbol(""), wh = /(^|;)\s*display\s*:/;
function kh(e, t, n) {
  const s = e.style, i = ft(n);
  let r = !1;
  if (n && !i) {
    if (t)
      if (ft(t))
        for (const o of t.split(";")) {
          const a = o.slice(0, o.indexOf(":")).trim();
          n[a] == null && bi(s, a, "");
        }
      else
        for (const o in t)
          n[o] == null && bi(s, o, "");
    for (const o in n)
      o === "display" && (r = !0), bi(s, o, n[o]);
  } else if (i) {
    if (t !== n) {
      const o = s[bh];
      o && (n += ";" + o), s.cssText = n, r = wh.test(n);
    }
  } else t && e.removeAttribute("style");
  Fi in e && (e[Fi] = r ? s.display : "", e[hc] && (s.display = "none"));
}
const Aa = /\s*!important$/;
function bi(e, t, n) {
  if (pe(n))
    n.forEach((s) => bi(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = xh(e, t);
    Aa.test(n) ? e.setProperty(
      Fn(s),
      n.replace(Aa, ""),
      "important"
    ) : e[s] = n;
  }
}
const Ta = ["Webkit", "Moz", "ms"], wr = {};
function xh(e, t) {
  const n = wr[t];
  if (n)
    return n;
  let s = On(t);
  if (s !== "filter" && s in e)
    return wr[t] = s;
  s = hl(s);
  for (let i = 0; i < Ta.length; i++) {
    const r = Ta[i] + s;
    if (r in e)
      return wr[t] = r;
  }
  return t;
}
const Sa = "http://www.w3.org/1999/xlink";
function Ea(e, t, n, s, i, r = Lu(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Sa, t.slice(6, t.length)) : e.setAttributeNS(Sa, t, n) : n == null || r && !dl(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    r ? "" : Mn(n) ? String(n) : n
  );
}
function Ca(e, t, n, s, i) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? fc(n) : n);
    return;
  }
  const r = e.tagName;
  if (t === "value" && r !== "PROGRESS" && // custom elements may use _value internally
  !r.includes("-")) {
    const a = r === "OPTION" ? e.getAttribute("value") || "" : e.value, l = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== l || !("_value" in e)) && (e.value = l), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let o = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = dl(n) : n == null && a === "string" ? (n = "", o = !0) : a === "number" && (n = 0, o = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  o && e.removeAttribute(i || t);
}
function ts(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Ah(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const Ra = Symbol("_vei");
function Th(e, t, n, s, i = null) {
  const r = e[Ra] || (e[Ra] = {}), o = r[t];
  if (s && o)
    o.value = s;
  else {
    const [a, l] = Sh(t);
    if (s) {
      const h = r[t] = Rh(
        s,
        i
      );
      ts(e, a, h, l);
    } else o && (Ah(e, a, o, l), r[t] = void 0);
  }
}
const Ia = /(?:Once|Passive|Capture)$/;
function Sh(e) {
  let t;
  if (Ia.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Ia); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : Fn(e.slice(2)), t];
}
let kr = 0;
const Eh = /* @__PURE__ */ Promise.resolve(), Ch = () => kr || (Eh.then(() => kr = 0), kr = Date.now());
function Rh(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    cn(
      Ih(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Ch(), n;
}
function Ih(e, t) {
  if (pe(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (s) => (i) => !i._stopped && s && s(i)
    );
  } else
    return t;
}
const La = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Lh = (e, t, n, s, i, r) => {
  const o = i === "svg";
  t === "class" ? yh(e, s, o) : t === "style" ? kh(e, n, s) : zi(t) ? io(t) || Th(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Oh(e, t, s, o)) ? (Ca(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ea(e, t, s, o, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !ft(s)) ? Ca(e, On(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Ea(e, t, s, o));
};
function Oh(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && La(t) && _e(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const i = e.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return La(t) && ft(n) ? !1 : t in e;
}
const Oa = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return pe(t) ? (n) => mi(t, n) : t;
};
function Nh(e) {
  e.target.composing = !0;
}
function Na(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const xr = Symbol("_assign"), Hn = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, i) {
    e[xr] = Oa(i);
    const r = s || i.props && i.props.type === "number";
    ts(e, t ? "change" : "input", (o) => {
      if (o.target.composing) return;
      let a = e.value;
      n && (a = a.trim()), r && (a = Mr(a)), e[xr](a);
    }), n && ts(e, "change", () => {
      e.value = e.value.trim();
    }), t || (ts(e, "compositionstart", Nh), ts(e, "compositionend", Na), ts(e, "change", Na));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: i, number: r } }, o) {
    if (e[xr] = Oa(o), e.composing) return;
    const a = (r || e.type === "number") && !/^0\d/.test(e.value) ? Mr(e.value) : e.value, l = t ?? "";
    a !== l && (document.activeElement === e && e.type !== "range" && (s && t === n || i && e.value.trim() === l) || (e.value = l));
  }
}, Ph = ["ctrl", "shift", "alt", "meta"], Mh = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => Ph.some((n) => e[`${n}Key`] && !t.includes(n))
}, Wn = (e, t) => {
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = (i, ...r) => {
    for (let o = 0; o < t.length; o++) {
      const a = Mh[t[o]];
      if (a && a(i, t)) return;
    }
    return e(i, ...r);
  });
}, Fh = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, wi = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = (i) => {
    if (!("key" in i))
      return;
    const r = Fn(i.key);
    if (t.some(
      (o) => o === r || Fh[o] === r
    ))
      return e(i);
  });
}, Dh = /* @__PURE__ */ wt({ patchProp: Lh }, mh);
let Pa;
function Bh() {
  return Pa || (Pa = Uf(Dh));
}
const $h = (...e) => {
  const t = Bh().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const i = zh(s);
    if (!i) return;
    const r = t._component;
    !_e(r) && !r.render && !r.template && (r.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const o = n(i, !1, Uh(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), o;
  }, t;
};
function Uh(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function zh(e) {
  return ft(e) ? document.querySelector(e) : e;
}
const ls = (e) => {
  const t = e.replace("#", ""), n = parseInt(t.substr(0, 2), 16), s = parseInt(t.substr(2, 2), 16), i = parseInt(t.substr(4, 2), 16);
  return (n * 299 + s * 587 + i * 114) / 1e3 < 128;
}, Hh = (e, t) => {
  const n = e.replace("#", ""), s = parseInt(n.substr(0, 2), 16), i = parseInt(n.substr(2, 2), 16), r = parseInt(n.substr(4, 2), 16), o = ls(e), a = o ? Math.min(255, s + t) : Math.max(0, s - t), l = o ? Math.min(255, i + t) : Math.max(0, i - t), h = o ? Math.min(255, r + t) : Math.max(0, r - t);
  return `#${a.toString(16).padStart(2, "0")}${l.toString(16).padStart(2, "0")}${h.toString(16).padStart(2, "0")}`;
}, ws = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), qh = (e) => {
  switch (e.type) {
    case "connection_error":
      return "Unable to connect. Please try again later.";
    case "auth_error":
      return "Authentication failed. Please refresh the page.";
    case "chat_error":
      return "Unable to send message. Please try again.";
    case "ai_config_missing":
      return "Chat service is currently unavailable.";
    default:
      return e.error || "Something went wrong. Please try again.";
  }
};
function bo() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
var Kn = bo();
function dc(e) {
  Kn = e;
}
var zs = { exec: () => null };
function Ge(e, t = "") {
  let n = typeof e == "string" ? e : e.source;
  const s = {
    replace: (i, r) => {
      let o = typeof r == "string" ? r : r.source;
      return o = o.replace(Rt.caret, "$1"), n = n.replace(i, o), s;
    },
    getRegex: () => new RegExp(n, t)
  };
  return s;
}
var Rt = {
  codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  listReplaceTabs: /^\t+/,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\] /,
  listReplaceTask: /^\[[ xX]\] +/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
  pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
  unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
  caret: /(^|[^\[])\^/g,
  percentDecode: /%25/g,
  findPipe: /\|/g,
  splitPipe: / \|/,
  slashPipe: /\\\|/g,
  carriageReturn: /\r\n|\r/g,
  spaceLine: /^ +$/gm,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  listItemRegex: (e) => new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
  htmlBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, "i")
}, Wh = /^(?:[ \t]*(?:\n|$))+/, jh = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Vh = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Zs = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Kh = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, wo = /(?:[*+-]|\d{1,9}[.)])/, pc = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, gc = Ge(pc).replace(/bull/g, wo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Gh = Ge(pc).replace(/bull/g, wo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), ko = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Yh = /^[^\n]+/, xo = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Xh = Ge(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", xo).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Zh = Ge(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, wo).getRegex(), Qi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Ao = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Jh = Ge(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", Ao).replace("tag", Qi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), mc = Ge(ko).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex(), Qh = Ge(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", mc).getRegex(), To = {
  blockquote: Qh,
  code: jh,
  def: Xh,
  fences: Vh,
  heading: Kh,
  hr: Zs,
  html: Jh,
  lheading: gc,
  list: Zh,
  newline: Wh,
  paragraph: mc,
  table: zs,
  text: Yh
}, Ma = Ge(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex(), ed = {
  ...To,
  lheading: Gh,
  table: Ma,
  paragraph: Ge(ko).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ma).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex()
}, td = {
  ...To,
  html: Ge(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", Ao).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: zs,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: Ge(ko).replace("hr", Zs).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", gc).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, nd = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, sd = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, _c = /^( {2,}|\\)\n(?!\s*$)/, id = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, er = /[\p{P}\p{S}]/u, So = /[\s\p{P}\p{S}]/u, yc = /[^\s\p{P}\p{S}]/u, rd = Ge(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, So).getRegex(), vc = /(?!~)[\p{P}\p{S}]/u, od = /(?!~)[\s\p{P}\p{S}]/u, ad = /(?:[^\s\p{P}\p{S}]|~)/u, ld = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, bc = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, cd = Ge(bc, "u").replace(/punct/g, er).getRegex(), ud = Ge(bc, "u").replace(/punct/g, vc).getRegex(), wc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", fd = Ge(wc, "gu").replace(/notPunctSpace/g, yc).replace(/punctSpace/g, So).replace(/punct/g, er).getRegex(), hd = Ge(wc, "gu").replace(/notPunctSpace/g, ad).replace(/punctSpace/g, od).replace(/punct/g, vc).getRegex(), dd = Ge(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, yc).replace(/punctSpace/g, So).replace(/punct/g, er).getRegex(), pd = Ge(/\\(punct)/, "gu").replace(/punct/g, er).getRegex(), gd = Ge(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), md = Ge(Ao).replace("(?:-->|$)", "-->").getRegex(), _d = Ge(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", md).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Di = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, yd = Ge(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Di).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), kc = Ge(/^!?\[(label)\]\[(ref)\]/).replace("label", Di).replace("ref", xo).getRegex(), xc = Ge(/^!?\[(ref)\](?:\[\])?/).replace("ref", xo).getRegex(), vd = Ge("reflink|nolink(?!\\()", "g").replace("reflink", kc).replace("nolink", xc).getRegex(), Eo = {
  _backpedal: zs,
  // only used for GFM url
  anyPunctuation: pd,
  autolink: gd,
  blockSkip: ld,
  br: _c,
  code: sd,
  del: zs,
  emStrongLDelim: cd,
  emStrongRDelimAst: fd,
  emStrongRDelimUnd: dd,
  escape: nd,
  link: yd,
  nolink: xc,
  punctuation: rd,
  reflink: kc,
  reflinkSearch: vd,
  tag: _d,
  text: id,
  url: zs
}, bd = {
  ...Eo,
  link: Ge(/^!?\[(label)\]\((.*?)\)/).replace("label", Di).getRegex(),
  reflink: Ge(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Di).getRegex()
}, Vr = {
  ...Eo,
  emStrongRDelimAst: hd,
  emStrongLDelim: ud,
  url: Ge(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, wd = {
  ...Vr,
  br: Ge(_c).replace("{2,}", "*").getRegex(),
  text: Ge(Vr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, fi = {
  normal: To,
  gfm: ed,
  pedantic: td
}, ks = {
  normal: Eo,
  gfm: Vr,
  breaks: wd,
  pedantic: bd
}, kd = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Fa = (e) => kd[e];
function nn(e, t) {
  if (t) {
    if (Rt.escapeTest.test(e))
      return e.replace(Rt.escapeReplace, Fa);
  } else if (Rt.escapeTestNoEncode.test(e))
    return e.replace(Rt.escapeReplaceNoEncode, Fa);
  return e;
}
function Da(e) {
  try {
    e = encodeURI(e).replace(Rt.percentDecode, "%");
  } catch {
    return null;
  }
  return e;
}
function Ba(e, t) {
  var r;
  const n = e.replace(Rt.findPipe, (o, a, l) => {
    let h = !1, c = a;
    for (; --c >= 0 && l[c] === "\\"; ) h = !h;
    return h ? "|" : " |";
  }), s = n.split(Rt.splitPipe);
  let i = 0;
  if (s[0].trim() || s.shift(), s.length > 0 && !((r = s.at(-1)) != null && r.trim()) && s.pop(), t)
    if (s.length > t)
      s.splice(t);
    else
      for (; s.length < t; ) s.push("");
  for (; i < s.length; i++)
    s[i] = s[i].trim().replace(Rt.slashPipe, "|");
  return s;
}
function xs(e, t, n) {
  const s = e.length;
  if (s === 0)
    return "";
  let i = 0;
  for (; i < s && e.charAt(s - i - 1) === t; )
    i++;
  return e.slice(0, s - i);
}
function xd(e, t) {
  if (e.indexOf(t[1]) === -1)
    return -1;
  let n = 0;
  for (let s = 0; s < e.length; s++)
    if (e[s] === "\\")
      s++;
    else if (e[s] === t[0])
      n++;
    else if (e[s] === t[1] && (n--, n < 0))
      return s;
  return n > 0 ? -2 : -1;
}
function $a(e, t, n, s, i) {
  const r = t.href, o = t.title || null, a = e[1].replace(i.other.outputLinkReplace, "$1");
  s.state.inLink = !0;
  const l = {
    type: e[0].charAt(0) === "!" ? "image" : "link",
    raw: n,
    href: r,
    title: o,
    text: a,
    tokens: s.inlineTokens(a)
  };
  return s.state.inLink = !1, l;
}
function Ad(e, t, n) {
  const s = e.match(n.other.indentCodeCompensation);
  if (s === null)
    return t;
  const i = s[1];
  return t.split(`
`).map((r) => {
    const o = r.match(n.other.beginningSpace);
    if (o === null)
      return r;
    const [a] = o;
    return a.length >= i.length ? r.slice(i.length) : r;
  }).join(`
`);
}
var Bi = class {
  // set by the lexer
  constructor(e) {
    nt(this, "options");
    nt(this, "rules");
    // set by the lexer
    nt(this, "lexer");
    this.options = e || Kn;
  }
  space(e) {
    const t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0)
      return {
        type: "space",
        raw: t[0]
      };
  }
  code(e) {
    const t = this.rules.block.code.exec(e);
    if (t) {
      const n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : xs(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], s = Ad(n, t[3] || "", this.rules);
      return {
        type: "code",
        raw: n,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: s
      };
    }
  }
  heading(e) {
    const t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        const s = xs(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(e) {
    const t = this.rules.block.hr.exec(e);
    if (t)
      return {
        type: "hr",
        raw: xs(t[0], `
`)
      };
  }
  blockquote(e) {
    const t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = xs(t[0], `
`).split(`
`), s = "", i = "";
      const r = [];
      for (; n.length > 0; ) {
        let o = !1;
        const a = [];
        let l;
        for (l = 0; l < n.length; l++)
          if (this.rules.other.blockquoteStart.test(n[l]))
            a.push(n[l]), o = !0;
          else if (!o)
            a.push(n[l]);
          else
            break;
        n = n.slice(l);
        const h = a.join(`
`), c = h.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${h}` : h, i = i ? `${i}
${c}` : c;
        const w = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, r, !0), this.lexer.state.top = w, n.length === 0)
          break;
        const m = r.at(-1);
        if ((m == null ? void 0 : m.type) === "code")
          break;
        if ((m == null ? void 0 : m.type) === "blockquote") {
          const P = m, M = P.raw + `
` + n.join(`
`), K = this.blockquote(M);
          r[r.length - 1] = K, s = s.substring(0, s.length - P.raw.length) + K.raw, i = i.substring(0, i.length - P.text.length) + K.text;
          break;
        } else if ((m == null ? void 0 : m.type) === "list") {
          const P = m, M = P.raw + `
` + n.join(`
`), K = this.list(M);
          r[r.length - 1] = K, s = s.substring(0, s.length - m.raw.length) + K.raw, i = i.substring(0, i.length - P.raw.length) + K.raw, n = M.substring(r.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: s,
        tokens: r,
        text: i
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim();
      const s = n.length > 1, i = {
        type: "list",
        raw: "",
        ordered: s,
        start: s ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      const r = this.rules.other.listItemRegex(n);
      let o = !1;
      for (; e; ) {
        let l = !1, h = "", c = "";
        if (!(t = r.exec(e)) || this.rules.block.hr.test(e))
          break;
        h = t[0], e = e.substring(h.length);
        let w = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (fe) => " ".repeat(3 * fe.length)), m = e.split(`
`, 1)[0], P = !w.trim(), M = 0;
        if (this.options.pedantic ? (M = 2, c = w.trimStart()) : P ? M = t[1].length + 1 : (M = t[2].search(this.rules.other.nonSpaceChar), M = M > 4 ? 1 : M, c = w.slice(M), M += t[1].length), P && this.rules.other.blankLine.test(m) && (h += m + `
`, e = e.substring(m.length + 1), l = !0), !l) {
          const fe = this.rules.other.nextBulletRegex(M), ge = this.rules.other.hrRegex(M), ve = this.rules.other.fencesBeginRegex(M), T = this.rules.other.headingBeginRegex(M), I = this.rules.other.htmlBeginRegex(M);
          for (; e; ) {
            const j = e.split(`
`, 1)[0];
            let G;
            if (m = j, this.options.pedantic ? (m = m.replace(this.rules.other.listReplaceNesting, "  "), G = m) : G = m.replace(this.rules.other.tabCharGlobal, "    "), ve.test(m) || T.test(m) || I.test(m) || fe.test(m) || ge.test(m))
              break;
            if (G.search(this.rules.other.nonSpaceChar) >= M || !m.trim())
              c += `
` + G.slice(M);
            else {
              if (P || w.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ve.test(w) || T.test(w) || ge.test(w))
                break;
              c += `
` + m;
            }
            !P && !m.trim() && (P = !0), h += j + `
`, e = e.substring(j.length + 1), w = G.slice(M);
          }
        }
        i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(h) && (o = !0));
        let K = null, Pe;
        this.options.gfm && (K = this.rules.other.listIsTask.exec(c), K && (Pe = K[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
          type: "list_item",
          raw: h,
          task: !!K,
          checked: Pe,
          loose: !1,
          text: c,
          tokens: []
        }), i.raw += h;
      }
      const a = i.items.at(-1);
      if (a)
        a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else
        return;
      i.raw = i.raw.trimEnd();
      for (let l = 0; l < i.items.length; l++)
        if (this.lexer.state.top = !1, i.items[l].tokens = this.lexer.blockTokens(i.items[l].text, []), !i.loose) {
          const h = i.items[l].tokens.filter((w) => w.type === "space"), c = h.length > 0 && h.some((w) => this.rules.other.anyLine.test(w.raw));
          i.loose = c;
        }
      if (i.loose)
        for (let l = 0; l < i.items.length; l++)
          i.items[l].loose = !0;
      return i;
    }
  }
  html(e) {
    const t = this.rules.block.html.exec(e);
    if (t)
      return {
        type: "html",
        block: !0,
        raw: t[0],
        pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
        text: t[0]
      };
  }
  def(e) {
    const t = this.rules.block.def.exec(e);
    if (t) {
      const n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: n,
        raw: t[0],
        href: s,
        title: i
      };
    }
  }
  table(e) {
    var o;
    const t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2]))
      return;
    const n = Ba(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = (o = t[3]) != null && o.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], r = {
      type: "table",
      raw: t[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === s.length) {
      for (const a of s)
        this.rules.other.tableAlignRight.test(a) ? r.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? r.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? r.align.push("left") : r.align.push(null);
      for (let a = 0; a < n.length; a++)
        r.header.push({
          text: n[a],
          tokens: this.lexer.inline(n[a]),
          header: !0,
          align: r.align[a]
        });
      for (const a of i)
        r.rows.push(Ba(a, r.header.length).map((l, h) => ({
          text: l,
          tokens: this.lexer.inline(l),
          header: !1,
          align: r.align[h]
        })));
      return r;
    }
  }
  lheading(e) {
    const t = this.rules.block.lheading.exec(e);
    if (t)
      return {
        type: "heading",
        raw: t[0],
        depth: t[2].charAt(0) === "=" ? 1 : 2,
        text: t[1],
        tokens: this.lexer.inline(t[1])
      };
  }
  paragraph(e) {
    const t = this.rules.block.paragraph.exec(e);
    if (t) {
      const n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(e) {
    const t = this.rules.block.text.exec(e);
    if (t)
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        tokens: this.lexer.inline(t[0])
      };
  }
  escape(e) {
    const t = this.rules.inline.escape.exec(e);
    if (t)
      return {
        type: "escape",
        raw: t[0],
        text: t[1]
      };
  }
  tag(e) {
    const t = this.rules.inline.tag.exec(e);
    if (t)
      return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: t[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: t[0]
      };
  }
  link(e) {
    const t = this.rules.inline.link.exec(e);
    if (t) {
      const n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n))
          return;
        const r = xs(n.slice(0, -1), "\\");
        if ((n.length - r.length) % 2 === 0)
          return;
      } else {
        const r = xd(t[2], "()");
        if (r === -2)
          return;
        if (r > -1) {
          const a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + r;
          t[2] = t[2].substring(0, r), t[0] = t[0].substring(0, a).trim(), t[3] = "";
        }
      }
      let s = t[2], i = "";
      if (this.options.pedantic) {
        const r = this.rules.other.pedanticHrefTitle.exec(s);
        r && (s = r[1], i = r[3]);
      } else
        i = t[3] ? t[3].slice(1, -1) : "";
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), $a(t, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      const s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = t[s.toLowerCase()];
      if (!i) {
        const r = n[0].charAt(0);
        return {
          type: "text",
          raw: r,
          text: r
        };
      }
      return $a(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const r = [...s[0]].length - 1;
      let o, a, l = r, h = 0;
      const c = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + r); (s = c.exec(t)) != null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
        if (a = [...o].length, s[3] || s[4]) {
          l += a;
          continue;
        } else if ((s[5] || s[6]) && r % 3 && !((r + a) % 3)) {
          h += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + h);
        const w = [...s[0]][0].length, m = e.slice(0, r + s.index + w + a);
        if (Math.min(r, a) % 2) {
          const M = m.slice(1, -1);
          return {
            type: "em",
            raw: m,
            text: M,
            tokens: this.lexer.inlineTokens(M)
          };
        }
        const P = m.slice(2, -2);
        return {
          type: "strong",
          raw: m,
          text: P,
          tokens: this.lexer.inlineTokens(P)
        };
      }
    }
  }
  codespan(e) {
    const t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " ");
      const s = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && i && (n = n.substring(1, n.length - 1)), {
        type: "codespan",
        raw: t[0],
        text: n
      };
    }
  }
  br(e) {
    const t = this.rules.inline.br.exec(e);
    if (t)
      return {
        type: "br",
        raw: t[0]
      };
  }
  del(e) {
    const t = this.rules.inline.del.exec(e);
    if (t)
      return {
        type: "del",
        raw: t[0],
        text: t[2],
        tokens: this.lexer.inlineTokens(t[2])
      };
  }
  autolink(e) {
    const t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), {
        type: "link",
        raw: t[0],
        text: n,
        href: s,
        tokens: [
          {
            type: "text",
            raw: n,
            text: n
          }
        ]
      };
    }
  }
  url(e) {
    var n;
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let s, i;
      if (t[2] === "@")
        s = t[0], i = "mailto:" + s;
      else {
        let r;
        do
          r = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (r !== t[0]);
        s = t[0], t[1] === "www." ? i = "http://" + t[0] : i = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  inlineText(e) {
    const t = this.rules.inline.text.exec(e);
    if (t) {
      const n = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        escaped: n
      };
    }
  }
}, yn = class Kr {
  constructor(t) {
    nt(this, "tokens");
    nt(this, "options");
    nt(this, "state");
    nt(this, "tokenizer");
    nt(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || Kn, this.options.tokenizer = this.options.tokenizer || new Bi(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      other: Rt,
      block: fi.normal,
      inline: ks.normal
    };
    this.options.pedantic ? (n.block = fi.pedantic, n.inline = ks.pedantic) : this.options.gfm && (n.block = fi.gfm, this.options.breaks ? n.inline = ks.breaks : n.inline = ks.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: fi,
      inline: ks
    };
  }
  /**
   * Static Lex Method
   */
  static lex(t, n) {
    return new Kr(n).lex(t);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(t, n) {
    return new Kr(n).inlineTokens(t);
  }
  /**
   * Preprocessing
   */
  lex(t) {
    t = t.replace(Rt.carriageReturn, `
`), this.blockTokens(t, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      const s = this.inlineQueue[n];
      this.inlineTokens(s.src, s.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(t, n = [], s = !1) {
    var i, r, o;
    for (this.options.pedantic && (t = t.replace(Rt.tabCharGlobal, "    ").replace(Rt.spaceLine, "")); t; ) {
      let a;
      if ((r = (i = this.options.extensions) == null ? void 0 : i.block) != null && r.some((h) => (a = h.call({ lexer: this }, t, n)) ? (t = t.substring(a.raw.length), n.push(a), !0) : !1))
        continue;
      if (a = this.tokenizer.space(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        a.raw.length === 1 && h !== void 0 ? h.raw += `
` : n.push(a);
        continue;
      }
      if (a = this.tokenizer.code(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "paragraph" || (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.at(-1).src = h.text) : n.push(a);
        continue;
      }
      if (a = this.tokenizer.fences(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.heading(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.hr(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.blockquote(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.list(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.html(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.def(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "paragraph" || (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.raw, this.inlineQueue.at(-1).src = h.text) : this.tokens.links[a.tag] || (this.tokens.links[a.tag] = {
          href: a.href,
          title: a.title
        });
        continue;
      }
      if (a = this.tokenizer.table(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.lheading(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      let l = t;
      if ((o = this.options.extensions) != null && o.startBlock) {
        let h = 1 / 0;
        const c = t.slice(1);
        let w;
        this.options.extensions.startBlock.forEach((m) => {
          w = m.call({ lexer: this }, c), typeof w == "number" && w >= 0 && (h = Math.min(h, w));
        }), h < 1 / 0 && h >= 0 && (l = t.substring(0, h + 1));
      }
      if (this.state.top && (a = this.tokenizer.paragraph(l))) {
        const h = n.at(-1);
        s && (h == null ? void 0 : h.type) === "paragraph" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = h.text) : n.push(a), s = l.length !== t.length, t = t.substring(a.raw.length);
        continue;
      }
      if (a = this.tokenizer.text(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = h.text) : n.push(a);
        continue;
      }
      if (t) {
        const h = "Infinite loop on byte: " + t.charCodeAt(0);
        if (this.options.silent) {
          console.error(h);
          break;
        } else
          throw new Error(h);
      }
    }
    return this.state.top = !0, n;
  }
  inline(t, n = []) {
    return this.inlineQueue.push({ src: t, tokens: n }), n;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(t, n = []) {
    var a, l, h;
    let s = t, i = null;
    if (this.tokens.links) {
      const c = Object.keys(this.tokens.links);
      if (c.length > 0)
        for (; (i = this.tokenizer.rules.inline.reflinkSearch.exec(s)) != null; )
          c.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (s = s.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (i = this.tokenizer.rules.inline.anyPunctuation.exec(s)) != null; )
      s = s.slice(0, i.index) + "++" + s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (i = this.tokenizer.rules.inline.blockSkip.exec(s)) != null; )
      s = s.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let r = !1, o = "";
    for (; t; ) {
      r || (o = ""), r = !1;
      let c;
      if ((l = (a = this.options.extensions) == null ? void 0 : a.inline) != null && l.some((m) => (c = m.call({ lexer: this }, t, n)) ? (t = t.substring(c.raw.length), n.push(c), !0) : !1))
        continue;
      if (c = this.tokenizer.escape(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.tag(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.link(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.reflink(t, this.tokens.links)) {
        t = t.substring(c.raw.length);
        const m = n.at(-1);
        c.type === "text" && (m == null ? void 0 : m.type) === "text" ? (m.raw += c.raw, m.text += c.text) : n.push(c);
        continue;
      }
      if (c = this.tokenizer.emStrong(t, s, o)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.codespan(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.br(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.del(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.autolink(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (!this.state.inLink && (c = this.tokenizer.url(t))) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      let w = t;
      if ((h = this.options.extensions) != null && h.startInline) {
        let m = 1 / 0;
        const P = t.slice(1);
        let M;
        this.options.extensions.startInline.forEach((K) => {
          M = K.call({ lexer: this }, P), typeof M == "number" && M >= 0 && (m = Math.min(m, M));
        }), m < 1 / 0 && m >= 0 && (w = t.substring(0, m + 1));
      }
      if (c = this.tokenizer.inlineText(w)) {
        t = t.substring(c.raw.length), c.raw.slice(-1) !== "_" && (o = c.raw.slice(-1)), r = !0;
        const m = n.at(-1);
        (m == null ? void 0 : m.type) === "text" ? (m.raw += c.raw, m.text += c.text) : n.push(c);
        continue;
      }
      if (t) {
        const m = "Infinite loop on byte: " + t.charCodeAt(0);
        if (this.options.silent) {
          console.error(m);
          break;
        } else
          throw new Error(m);
      }
    }
    return n;
  }
}, $i = class {
  // set by the parser
  constructor(e) {
    nt(this, "options");
    nt(this, "parser");
    this.options = e || Kn;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    var r;
    const s = (r = (t || "").match(Rt.notSpaceStart)) == null ? void 0 : r[0], i = e.replace(Rt.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + nn(s) + '">' + (n ? i : nn(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : nn(i, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    const t = e.ordered, n = e.start;
    let s = "";
    for (let o = 0; o < e.items.length; o++) {
      const a = e.items[o];
      s += this.listitem(a);
    }
    const i = t ? "ol" : "ul", r = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + r + `>
` + s + "</" + i + `>
`;
  }
  listitem(e) {
    var n;
    let t = "";
    if (e.task) {
      const s = this.checkbox({ checked: !!e.checked });
      e.loose ? ((n = e.tokens[0]) == null ? void 0 : n.type) === "paragraph" ? (e.tokens[0].text = s + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && e.tokens[0].tokens[0].type === "text" && (e.tokens[0].tokens[0].text = s + " " + nn(e.tokens[0].tokens[0].text), e.tokens[0].tokens[0].escaped = !0)) : e.tokens.unshift({
        type: "text",
        raw: s + " ",
        text: s + " ",
        escaped: !0
      }) : t += s + " ";
    }
    return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let i = 0; i < e.header.length; i++)
      n += this.tablecell(e.header[i]);
    t += this.tablerow({ text: n });
    let s = "";
    for (let i = 0; i < e.rows.length; i++) {
      const r = e.rows[i];
      n = "";
      for (let o = 0; o < r.length; o++)
        n += this.tablecell(r[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    const t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  /**
   * span level renderer
   */
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${nn(e, !0)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    const s = this.parser.parseInline(n), i = Da(e);
    if (i === null)
      return s;
    e = i;
    let r = '<a href="' + e + '"';
    return t && (r += ' title="' + nn(t) + '"'), r += ">" + s + "</a>", r;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    const i = Da(e);
    if (i === null)
      return nn(n);
    e = i;
    let r = `<img src="${e}" alt="${n}"`;
    return t && (r += ` title="${nn(t)}"`), r += ">", r;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : nn(e.text);
  }
}, Co = class {
  // no need for block level renderers
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
}, vn = class Gr {
  constructor(t) {
    nt(this, "options");
    nt(this, "renderer");
    nt(this, "textRenderer");
    this.options = t || Kn, this.options.renderer = this.options.renderer || new $i(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Co();
  }
  /**
   * Static Parse Method
   */
  static parse(t, n) {
    return new Gr(n).parse(t);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(t, n) {
    return new Gr(n).parseInline(t);
  }
  /**
   * Parse Loop
   */
  parse(t, n = !0) {
    var i, r;
    let s = "";
    for (let o = 0; o < t.length; o++) {
      const a = t[o];
      if ((r = (i = this.options.extensions) == null ? void 0 : i.renderers) != null && r[a.type]) {
        const h = a, c = this.options.extensions.renderers[h.type].call({ parser: this }, h);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(h.type)) {
          s += c || "";
          continue;
        }
      }
      const l = a;
      switch (l.type) {
        case "space": {
          s += this.renderer.space(l);
          continue;
        }
        case "hr": {
          s += this.renderer.hr(l);
          continue;
        }
        case "heading": {
          s += this.renderer.heading(l);
          continue;
        }
        case "code": {
          s += this.renderer.code(l);
          continue;
        }
        case "table": {
          s += this.renderer.table(l);
          continue;
        }
        case "blockquote": {
          s += this.renderer.blockquote(l);
          continue;
        }
        case "list": {
          s += this.renderer.list(l);
          continue;
        }
        case "html": {
          s += this.renderer.html(l);
          continue;
        }
        case "paragraph": {
          s += this.renderer.paragraph(l);
          continue;
        }
        case "text": {
          let h = l, c = this.renderer.text(h);
          for (; o + 1 < t.length && t[o + 1].type === "text"; )
            h = t[++o], c += `
` + this.renderer.text(h);
          n ? s += this.renderer.paragraph({
            type: "paragraph",
            raw: c,
            text: c,
            tokens: [{ type: "text", raw: c, text: c, escaped: !0 }]
          }) : s += c;
          continue;
        }
        default: {
          const h = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent)
            return console.error(h), "";
          throw new Error(h);
        }
      }
    }
    return s;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(t, n = this.renderer) {
    var i, r;
    let s = "";
    for (let o = 0; o < t.length; o++) {
      const a = t[o];
      if ((r = (i = this.options.extensions) == null ? void 0 : i.renderers) != null && r[a.type]) {
        const h = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (h !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(a.type)) {
          s += h || "";
          continue;
        }
      }
      const l = a;
      switch (l.type) {
        case "escape": {
          s += n.text(l);
          break;
        }
        case "html": {
          s += n.html(l);
          break;
        }
        case "link": {
          s += n.link(l);
          break;
        }
        case "image": {
          s += n.image(l);
          break;
        }
        case "strong": {
          s += n.strong(l);
          break;
        }
        case "em": {
          s += n.em(l);
          break;
        }
        case "codespan": {
          s += n.codespan(l);
          break;
        }
        case "br": {
          s += n.br(l);
          break;
        }
        case "del": {
          s += n.del(l);
          break;
        }
        case "text": {
          s += n.text(l);
          break;
        }
        default: {
          const h = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent)
            return console.error(h), "";
          throw new Error(h);
        }
      }
    }
    return s;
  }
}, Nr, ki = (Nr = class {
  constructor(e) {
    nt(this, "options");
    nt(this, "block");
    this.options = e || Kn;
  }
  /**
   * Process markdown before marked
   */
  preprocess(e) {
    return e;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(e) {
    return e;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(e) {
    return e;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? yn.lex : yn.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? vn.parse : vn.parseInline;
  }
}, nt(Nr, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
])), Nr), Td = class {
  constructor(...e) {
    nt(this, "defaults", bo());
    nt(this, "options", this.setOptions);
    nt(this, "parse", this.parseMarkdown(!0));
    nt(this, "parseInline", this.parseMarkdown(!1));
    nt(this, "Parser", vn);
    nt(this, "Renderer", $i);
    nt(this, "TextRenderer", Co);
    nt(this, "Lexer", yn);
    nt(this, "Tokenizer", Bi);
    nt(this, "Hooks", ki);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, t) {
    var s, i;
    let n = [];
    for (const r of e)
      switch (n = n.concat(t.call(this, r)), r.type) {
        case "table": {
          const o = r;
          for (const a of o.header)
            n = n.concat(this.walkTokens(a.tokens, t));
          for (const a of o.rows)
            for (const l of a)
              n = n.concat(this.walkTokens(l.tokens, t));
          break;
        }
        case "list": {
          const o = r;
          n = n.concat(this.walkTokens(o.items, t));
          break;
        }
        default: {
          const o = r;
          (i = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && i[o.type] ? this.defaults.extensions.childTokens[o.type].forEach((a) => {
            const l = o[a].flat(1 / 0);
            n = n.concat(this.walkTokens(l, t));
          }) : o.tokens && (n = n.concat(this.walkTokens(o.tokens, t)));
        }
      }
    return n;
  }
  use(...e) {
    const t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      const s = { ...n };
      if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name)
          throw new Error("extension name required");
        if ("renderer" in i) {
          const r = t.renderers[i.name];
          r ? t.renderers[i.name] = function(...o) {
            let a = i.renderer.apply(this, o);
            return a === !1 && (a = r.apply(this, o)), a;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const r = t[i.level];
          r ? r.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), s.extensions = t), n.renderer) {
        const i = this.defaults.renderer || new $i(this.defaults);
        for (const r in n.renderer) {
          if (!(r in i))
            throw new Error(`renderer '${r}' does not exist`);
          if (["options", "parser"].includes(r))
            continue;
          const o = r, a = n.renderer[o], l = i[o];
          i[o] = (...h) => {
            let c = a.apply(i, h);
            return c === !1 && (c = l.apply(i, h)), c || "";
          };
        }
        s.renderer = i;
      }
      if (n.tokenizer) {
        const i = this.defaults.tokenizer || new Bi(this.defaults);
        for (const r in n.tokenizer) {
          if (!(r in i))
            throw new Error(`tokenizer '${r}' does not exist`);
          if (["options", "rules", "lexer"].includes(r))
            continue;
          const o = r, a = n.tokenizer[o], l = i[o];
          i[o] = (...h) => {
            let c = a.apply(i, h);
            return c === !1 && (c = l.apply(i, h)), c;
          };
        }
        s.tokenizer = i;
      }
      if (n.hooks) {
        const i = this.defaults.hooks || new ki();
        for (const r in n.hooks) {
          if (!(r in i))
            throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r))
            continue;
          const o = r, a = n.hooks[o], l = i[o];
          ki.passThroughHooks.has(r) ? i[o] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(i, h)).then((w) => l.call(i, w));
            const c = a.call(i, h);
            return l.call(i, c);
          } : i[o] = (...h) => {
            let c = a.apply(i, h);
            return c === !1 && (c = l.apply(i, h)), c;
          };
        }
        s.hooks = i;
      }
      if (n.walkTokens) {
        const i = this.defaults.walkTokens, r = n.walkTokens;
        s.walkTokens = function(o) {
          let a = [];
          return a.push(r.call(this, o)), i && (a = a.concat(i.call(this, o))), a;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return yn.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return vn.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, s) => {
      const i = { ...s }, r = { ...this.defaults, ...i }, o = this.onError(!!r.silent, !!r.async);
      if (this.defaults.async === !0 && i.async === !1)
        return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      r.hooks && (r.hooks.options = r, r.hooks.block = e);
      const a = r.hooks ? r.hooks.provideLexer() : e ? yn.lex : yn.lexInline, l = r.hooks ? r.hooks.provideParser() : e ? vn.parse : vn.parseInline;
      if (r.async)
        return Promise.resolve(r.hooks ? r.hooks.preprocess(n) : n).then((h) => a(h, r)).then((h) => r.hooks ? r.hooks.processAllTokens(h) : h).then((h) => r.walkTokens ? Promise.all(this.walkTokens(h, r.walkTokens)).then(() => h) : h).then((h) => l(h, r)).then((h) => r.hooks ? r.hooks.postprocess(h) : h).catch(o);
      try {
        r.hooks && (n = r.hooks.preprocess(n));
        let h = a(n, r);
        r.hooks && (h = r.hooks.processAllTokens(h)), r.walkTokens && this.walkTokens(h, r.walkTokens);
        let c = l(h, r);
        return r.hooks && (c = r.hooks.postprocess(c)), c;
      } catch (h) {
        return o(h);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        const s = "<p>An error occurred:</p><pre>" + nn(n.message + "", !0) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t)
        return Promise.reject(n);
      throw n;
    };
  }
}, Vn = new Td();
function Ue(e, t) {
  return Vn.parse(e, t);
}
Ue.options = Ue.setOptions = function(e) {
  return Vn.setOptions(e), Ue.defaults = Vn.defaults, dc(Ue.defaults), Ue;
};
Ue.getDefaults = bo;
Ue.defaults = Kn;
Ue.use = function(...e) {
  return Vn.use(...e), Ue.defaults = Vn.defaults, dc(Ue.defaults), Ue;
};
Ue.walkTokens = function(e, t) {
  return Vn.walkTokens(e, t);
};
Ue.parseInline = Vn.parseInline;
Ue.Parser = vn;
Ue.parser = vn.parse;
Ue.Renderer = $i;
Ue.TextRenderer = Co;
Ue.Lexer = yn;
Ue.lexer = yn.lex;
Ue.Tokenizer = Bi;
Ue.Hooks = ki;
Ue.parse = Ue;
Ue.options;
Ue.setOptions;
Ue.use;
Ue.walkTokens;
Ue.parseInline;
vn.parse;
yn.lex;
/*! @license DOMPurify 3.2.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.6/LICENSE */
const {
  entries: Ac,
  setPrototypeOf: Ua,
  isFrozen: Sd,
  getPrototypeOf: Ed,
  getOwnPropertyDescriptor: Cd
} = Object;
let {
  freeze: It,
  seal: Kt,
  create: Tc
} = Object, {
  apply: Yr,
  construct: Xr
} = typeof Reflect < "u" && Reflect;
It || (It = function(t) {
  return t;
});
Kt || (Kt = function(t) {
  return t;
});
Yr || (Yr = function(t, n, s) {
  return t.apply(n, s);
});
Xr || (Xr = function(t, n) {
  return new t(...n);
});
const hi = Lt(Array.prototype.forEach), Rd = Lt(Array.prototype.lastIndexOf), za = Lt(Array.prototype.pop), As = Lt(Array.prototype.push), Id = Lt(Array.prototype.splice), xi = Lt(String.prototype.toLowerCase), Ar = Lt(String.prototype.toString), Ha = Lt(String.prototype.match), Ts = Lt(String.prototype.replace), Ld = Lt(String.prototype.indexOf), Od = Lt(String.prototype.trim), Zt = Lt(Object.prototype.hasOwnProperty), Tt = Lt(RegExp.prototype.test), Ss = Nd(TypeError);
function Lt(e) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
      s[i - 1] = arguments[i];
    return Yr(e, t, s);
  };
}
function Nd(e) {
  return function() {
    for (var t = arguments.length, n = new Array(t), s = 0; s < t; s++)
      n[s] = arguments[s];
    return Xr(e, n);
  };
}
function Ce(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : xi;
  Ua && Ua(e, null);
  let s = t.length;
  for (; s--; ) {
    let i = t[s];
    if (typeof i == "string") {
      const r = n(i);
      r !== i && (Sd(t) || (t[s] = r), i = r);
    }
    e[i] = !0;
  }
  return e;
}
function Pd(e) {
  for (let t = 0; t < e.length; t++)
    Zt(e, t) || (e[t] = null);
  return e;
}
function pn(e) {
  const t = Tc(null);
  for (const [n, s] of Ac(e))
    Zt(e, n) && (Array.isArray(s) ? t[n] = Pd(s) : s && typeof s == "object" && s.constructor === Object ? t[n] = pn(s) : t[n] = s);
  return t;
}
function Es(e, t) {
  for (; e !== null; ) {
    const s = Cd(e, t);
    if (s) {
      if (s.get)
        return Lt(s.get);
      if (typeof s.value == "function")
        return Lt(s.value);
    }
    e = Ed(e);
  }
  function n() {
    return null;
  }
  return n;
}
const qa = It(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Tr = It(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Sr = It(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Md = It(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Er = It(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Fd = It(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Wa = It(["#text"]), ja = It(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]), Cr = It(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Va = It(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), di = It(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Dd = Kt(/\{\{[\w\W]*|[\w\W]*\}\}/gm), Bd = Kt(/<%[\w\W]*|[\w\W]*%>/gm), $d = Kt(/\$\{[\w\W]*/gm), Ud = Kt(/^data-[\-\w.\u00B7-\uFFFF]+$/), zd = Kt(/^aria-[\-\w]+$/), Sc = Kt(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Hd = Kt(/^(?:\w+script|data):/i), qd = Kt(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), Ec = Kt(/^html$/i), Wd = Kt(/^[a-z][.\w]*(-[.\w]+)+$/i);
var Ka = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR: zd,
  ATTR_WHITESPACE: qd,
  CUSTOM_ELEMENT: Wd,
  DATA_ATTR: Ud,
  DOCTYPE_NAME: Ec,
  ERB_EXPR: Bd,
  IS_ALLOWED_URI: Sc,
  IS_SCRIPT_OR_DATA: Hd,
  MUSTACHE_EXPR: Dd,
  TMPLIT_EXPR: $d
});
const Cs = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, jd = function() {
  return typeof window > "u" ? null : window;
}, Vd = function(t, n) {
  if (typeof t != "object" || typeof t.createPolicy != "function")
    return null;
  let s = null;
  const i = "data-tt-policy-suffix";
  n && n.hasAttribute(i) && (s = n.getAttribute(i));
  const r = "dompurify" + (s ? "#" + s : "");
  try {
    return t.createPolicy(r, {
      createHTML(o) {
        return o;
      },
      createScriptURL(o) {
        return o;
      }
    });
  } catch {
    return console.warn("TrustedTypes policy " + r + " could not be created."), null;
  }
}, Ga = function() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function Cc() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : jd();
  const t = (W) => Cc(W);
  if (t.version = "3.2.6", t.removed = [], !e || !e.document || e.document.nodeType !== Cs.document || !e.Element)
    return t.isSupported = !1, t;
  let {
    document: n
  } = e;
  const s = n, i = s.currentScript, {
    DocumentFragment: r,
    HTMLTemplateElement: o,
    Node: a,
    Element: l,
    NodeFilter: h,
    NamedNodeMap: c = e.NamedNodeMap || e.MozNamedAttrMap,
    HTMLFormElement: w,
    DOMParser: m,
    trustedTypes: P
  } = e, M = l.prototype, K = Es(M, "cloneNode"), Pe = Es(M, "remove"), fe = Es(M, "nextSibling"), ge = Es(M, "childNodes"), ve = Es(M, "parentNode");
  if (typeof o == "function") {
    const W = n.createElement("template");
    W.content && W.content.ownerDocument && (n = W.content.ownerDocument);
  }
  let T, I = "";
  const {
    implementation: j,
    createNodeIterator: G,
    createDocumentFragment: Ae,
    getElementsByTagName: ze
  } = n, {
    importNode: Ze
  } = s;
  let Re = Ga();
  t.isSupported = typeof Ac == "function" && typeof ve == "function" && j && j.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: ye,
    ERB_EXPR: Qe,
    TMPLIT_EXPR: it,
    DATA_ATTR: lt,
    ARIA_ATTR: ue,
    IS_SCRIPT_OR_DATA: de,
    ATTR_WHITESPACE: ae,
    CUSTOM_ELEMENT: Se
  } = Ka;
  let {
    IS_ALLOWED_URI: rt
  } = Ka, oe = null;
  const Me = Ce({}, [...qa, ...Tr, ...Sr, ...Er, ...Wa]);
  let De = null;
  const yt = Ce({}, [...ja, ...Cr, ...Va, ...di]);
  let Ie = Object.seal(Tc(null, {
    tagNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    attributeNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: !1
    }
  })), q = null, Ne = null, le = !0, Le = !0, V = !1, pt = !0, p = !1, y = !0, x = !1, F = !1, L = !1, R = !1, U = !1, z = !1, $ = !0, D = !1;
  const J = "user-content-";
  let H = !0, Z = !1, te = {}, re = null;
  const me = Ce({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let Te = null;
  const Fe = Ce({}, ["audio", "video", "img", "source", "image", "track"]);
  let Ye = null;
  const ht = Ce({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), f = "http://www.w3.org/1998/Math/MathML", v = "http://www.w3.org/2000/svg", C = "http://www.w3.org/1999/xhtml";
  let S = C, B = !1, Y = null;
  const ne = Ce({}, [f, v, C], Ar);
  let we = Ce({}, ["mi", "mo", "mn", "ms", "mtext"]), Ee = Ce({}, ["annotation-xml"]);
  const et = Ce({}, ["title", "style", "font", "a", "script"]);
  let Be = null;
  const ct = ["application/xhtml+xml", "text/html"], kt = "text/html";
  let Xe = null, Pt = null;
  const Js = n.createElement("form"), fs = function(_) {
    return _ instanceof RegExp || _ instanceof Function;
  }, Mt = function() {
    let _ = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!(Pt && Pt === _)) {
      if ((!_ || typeof _ != "object") && (_ = {}), _ = pn(_), Be = // eslint-disable-next-line unicorn/prefer-includes
      ct.indexOf(_.PARSER_MEDIA_TYPE) === -1 ? kt : _.PARSER_MEDIA_TYPE, Xe = Be === "application/xhtml+xml" ? Ar : xi, oe = Zt(_, "ALLOWED_TAGS") ? Ce({}, _.ALLOWED_TAGS, Xe) : Me, De = Zt(_, "ALLOWED_ATTR") ? Ce({}, _.ALLOWED_ATTR, Xe) : yt, Y = Zt(_, "ALLOWED_NAMESPACES") ? Ce({}, _.ALLOWED_NAMESPACES, Ar) : ne, Ye = Zt(_, "ADD_URI_SAFE_ATTR") ? Ce(pn(ht), _.ADD_URI_SAFE_ATTR, Xe) : ht, Te = Zt(_, "ADD_DATA_URI_TAGS") ? Ce(pn(Fe), _.ADD_DATA_URI_TAGS, Xe) : Fe, re = Zt(_, "FORBID_CONTENTS") ? Ce({}, _.FORBID_CONTENTS, Xe) : me, q = Zt(_, "FORBID_TAGS") ? Ce({}, _.FORBID_TAGS, Xe) : pn({}), Ne = Zt(_, "FORBID_ATTR") ? Ce({}, _.FORBID_ATTR, Xe) : pn({}), te = Zt(_, "USE_PROFILES") ? _.USE_PROFILES : !1, le = _.ALLOW_ARIA_ATTR !== !1, Le = _.ALLOW_DATA_ATTR !== !1, V = _.ALLOW_UNKNOWN_PROTOCOLS || !1, pt = _.ALLOW_SELF_CLOSE_IN_ATTR !== !1, p = _.SAFE_FOR_TEMPLATES || !1, y = _.SAFE_FOR_XML !== !1, x = _.WHOLE_DOCUMENT || !1, R = _.RETURN_DOM || !1, U = _.RETURN_DOM_FRAGMENT || !1, z = _.RETURN_TRUSTED_TYPE || !1, L = _.FORCE_BODY || !1, $ = _.SANITIZE_DOM !== !1, D = _.SANITIZE_NAMED_PROPS || !1, H = _.KEEP_CONTENT !== !1, Z = _.IN_PLACE || !1, rt = _.ALLOWED_URI_REGEXP || Sc, S = _.NAMESPACE || C, we = _.MATHML_TEXT_INTEGRATION_POINTS || we, Ee = _.HTML_INTEGRATION_POINTS || Ee, Ie = _.CUSTOM_ELEMENT_HANDLING || {}, _.CUSTOM_ELEMENT_HANDLING && fs(_.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (Ie.tagNameCheck = _.CUSTOM_ELEMENT_HANDLING.tagNameCheck), _.CUSTOM_ELEMENT_HANDLING && fs(_.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (Ie.attributeNameCheck = _.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), _.CUSTOM_ELEMENT_HANDLING && typeof _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == "boolean" && (Ie.allowCustomizedBuiltInElements = _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), p && (Le = !1), U && (R = !0), te && (oe = Ce({}, Wa), De = [], te.html === !0 && (Ce(oe, qa), Ce(De, ja)), te.svg === !0 && (Ce(oe, Tr), Ce(De, Cr), Ce(De, di)), te.svgFilters === !0 && (Ce(oe, Sr), Ce(De, Cr), Ce(De, di)), te.mathMl === !0 && (Ce(oe, Er), Ce(De, Va), Ce(De, di))), _.ADD_TAGS && (oe === Me && (oe = pn(oe)), Ce(oe, _.ADD_TAGS, Xe)), _.ADD_ATTR && (De === yt && (De = pn(De)), Ce(De, _.ADD_ATTR, Xe)), _.ADD_URI_SAFE_ATTR && Ce(Ye, _.ADD_URI_SAFE_ATTR, Xe), _.FORBID_CONTENTS && (re === me && (re = pn(re)), Ce(re, _.FORBID_CONTENTS, Xe)), H && (oe["#text"] = !0), x && Ce(oe, ["html", "head", "body"]), oe.table && (Ce(oe, ["tbody"]), delete q.tbody), _.TRUSTED_TYPES_POLICY) {
        if (typeof _.TRUSTED_TYPES_POLICY.createHTML != "function")
          throw Ss('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof _.TRUSTED_TYPES_POLICY.createScriptURL != "function")
          throw Ss('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        T = _.TRUSTED_TYPES_POLICY, I = T.createHTML("");
      } else
        T === void 0 && (T = Vd(P, i)), T !== null && typeof I == "string" && (I = T.createHTML(""));
      It && It(_), Pt = _;
    }
  }, Gn = Ce({}, [...Tr, ...Sr, ...Md]), en = Ce({}, [...Er, ...Fd]), Qs = function(_) {
    let N = ve(_);
    (!N || !N.tagName) && (N = {
      namespaceURI: S,
      tagName: "template"
    });
    const X = xi(_.tagName), He = xi(N.tagName);
    return Y[_.namespaceURI] ? _.namespaceURI === v ? N.namespaceURI === C ? X === "svg" : N.namespaceURI === f ? X === "svg" && (He === "annotation-xml" || we[He]) : !!Gn[X] : _.namespaceURI === f ? N.namespaceURI === C ? X === "math" : N.namespaceURI === v ? X === "math" && Ee[He] : !!en[X] : _.namespaceURI === C ? N.namespaceURI === v && !Ee[He] || N.namespaceURI === f && !we[He] ? !1 : !en[X] && (et[X] || !Gn[X]) : !!(Be === "application/xhtml+xml" && Y[_.namespaceURI]) : !1;
  }, xt = function(_) {
    As(t.removed, {
      element: _
    });
    try {
      ve(_).removeChild(_);
    } catch {
      Pe(_);
    }
  }, fn = function(_, N) {
    try {
      As(t.removed, {
        attribute: N.getAttributeNode(_),
        from: N
      });
    } catch {
      As(t.removed, {
        attribute: null,
        from: N
      });
    }
    if (N.removeAttribute(_), _ === "is")
      if (R || U)
        try {
          xt(N);
        } catch {
        }
      else
        try {
          N.setAttribute(_, "");
        } catch {
        }
  }, xn = function(_) {
    let N = null, X = null;
    if (L)
      _ = "<remove></remove>" + _;
    else {
      const tt = Ha(_, /^[\r\n\t ]+/);
      X = tt && tt[0];
    }
    Be === "application/xhtml+xml" && S === C && (_ = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + _ + "</body></html>");
    const He = T ? T.createHTML(_) : _;
    if (S === C)
      try {
        N = new m().parseFromString(He, Be);
      } catch {
      }
    if (!N || !N.documentElement) {
      N = j.createDocument(S, "template", null);
      try {
        N.documentElement.innerHTML = B ? I : He;
      } catch {
      }
    }
    const dt = N.body || N.documentElement;
    return _ && X && dt.insertBefore(n.createTextNode(X), dt.childNodes[0] || null), S === C ? ze.call(N, x ? "html" : "body")[0] : x ? N.documentElement : dt;
  }, ei = function(_) {
    return G.call(
      _.ownerDocument || _,
      _,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, An = function(_) {
    return _ instanceof w && (typeof _.nodeName != "string" || typeof _.textContent != "string" || typeof _.removeChild != "function" || !(_.attributes instanceof c) || typeof _.removeAttribute != "function" || typeof _.setAttribute != "function" || typeof _.namespaceURI != "string" || typeof _.insertBefore != "function" || typeof _.hasChildNodes != "function");
  }, hs = function(_) {
    return typeof a == "function" && _ instanceof a;
  };
  function Gt(W, _, N) {
    hi(W, (X) => {
      X.call(t, _, N, Pt);
    });
  }
  const ds = function(_) {
    let N = null;
    if (Gt(Re.beforeSanitizeElements, _, null), An(_))
      return xt(_), !0;
    const X = Xe(_.nodeName);
    if (Gt(Re.uponSanitizeElement, _, {
      tagName: X,
      allowedTags: oe
    }), y && _.hasChildNodes() && !hs(_.firstElementChild) && Tt(/<[/\w!]/g, _.innerHTML) && Tt(/<[/\w!]/g, _.textContent) || _.nodeType === Cs.progressingInstruction || y && _.nodeType === Cs.comment && Tt(/<[/\w]/g, _.data))
      return xt(_), !0;
    if (!oe[X] || q[X]) {
      if (!q[X] && Yn(X) && (Ie.tagNameCheck instanceof RegExp && Tt(Ie.tagNameCheck, X) || Ie.tagNameCheck instanceof Function && Ie.tagNameCheck(X)))
        return !1;
      if (H && !re[X]) {
        const He = ve(_) || _.parentNode, dt = ge(_) || _.childNodes;
        if (dt && He) {
          const tt = dt.length;
          for (let qe = tt - 1; qe >= 0; --qe) {
            const At = K(dt[qe], !0);
            At.__removalCount = (_.__removalCount || 0) + 1, He.insertBefore(At, fe(_));
          }
        }
      }
      return xt(_), !0;
    }
    return _ instanceof l && !Qs(_) || (X === "noscript" || X === "noembed" || X === "noframes") && Tt(/<\/no(script|embed|frames)/i, _.innerHTML) ? (xt(_), !0) : (p && _.nodeType === Cs.text && (N = _.textContent, hi([ye, Qe, it], (He) => {
      N = Ts(N, He, " ");
    }), _.textContent !== N && (As(t.removed, {
      element: _.cloneNode()
    }), _.textContent = N)), Gt(Re.afterSanitizeElements, _, null), !1);
  }, Dn = function(_, N, X) {
    if ($ && (N === "id" || N === "name") && (X in n || X in Js))
      return !1;
    if (!(Le && !Ne[N] && Tt(lt, N))) {
      if (!(le && Tt(ue, N))) {
        if (!De[N] || Ne[N]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(Yn(_) && (Ie.tagNameCheck instanceof RegExp && Tt(Ie.tagNameCheck, _) || Ie.tagNameCheck instanceof Function && Ie.tagNameCheck(_)) && (Ie.attributeNameCheck instanceof RegExp && Tt(Ie.attributeNameCheck, N) || Ie.attributeNameCheck instanceof Function && Ie.attributeNameCheck(N)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            N === "is" && Ie.allowCustomizedBuiltInElements && (Ie.tagNameCheck instanceof RegExp && Tt(Ie.tagNameCheck, X) || Ie.tagNameCheck instanceof Function && Ie.tagNameCheck(X)))
          ) return !1;
        } else if (!Ye[N]) {
          if (!Tt(rt, Ts(X, ae, ""))) {
            if (!((N === "src" || N === "xlink:href" || N === "href") && _ !== "script" && Ld(X, "data:") === 0 && Te[_])) {
              if (!(V && !Tt(de, Ts(X, ae, "")))) {
                if (X)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Yn = function(_) {
    return _ !== "annotation-xml" && Ha(_, Se);
  }, Ft = function(_) {
    Gt(Re.beforeSanitizeAttributes, _, null);
    const {
      attributes: N
    } = _;
    if (!N || An(_))
      return;
    const X = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: De,
      forceKeepAttr: void 0
    };
    let He = N.length;
    for (; He--; ) {
      const dt = N[He], {
        name: tt,
        namespaceURI: qe,
        value: At
      } = dt, Dt = Xe(tt), ps = At;
      let gt = tt === "value" ? ps : Od(ps);
      if (X.attrName = Dt, X.attrValue = gt, X.keepAttr = !0, X.forceKeepAttr = void 0, Gt(Re.uponSanitizeAttribute, _, X), gt = X.attrValue, D && (Dt === "id" || Dt === "name") && (fn(tt, _), gt = J + gt), y && Tt(/((--!?|])>)|<\/(style|title)/i, gt)) {
        fn(tt, _);
        continue;
      }
      if (X.forceKeepAttr)
        continue;
      if (!X.keepAttr) {
        fn(tt, _);
        continue;
      }
      if (!pt && Tt(/\/>/i, gt)) {
        fn(tt, _);
        continue;
      }
      p && hi([ye, Qe, it], (ni) => {
        gt = Ts(gt, ni, " ");
      });
      const ti = Xe(_.nodeName);
      if (!Dn(ti, Dt, gt)) {
        fn(tt, _);
        continue;
      }
      if (T && typeof P == "object" && typeof P.getAttributeType == "function" && !qe)
        switch (P.getAttributeType(ti, Dt)) {
          case "TrustedHTML": {
            gt = T.createHTML(gt);
            break;
          }
          case "TrustedScriptURL": {
            gt = T.createScriptURL(gt);
            break;
          }
        }
      if (gt !== ps)
        try {
          qe ? _.setAttributeNS(qe, tt, gt) : _.setAttribute(tt, gt), An(_) ? xt(_) : za(t.removed);
        } catch {
          fn(tt, _);
        }
    }
    Gt(Re.afterSanitizeAttributes, _, null);
  }, Ut = function W(_) {
    let N = null;
    const X = ei(_);
    for (Gt(Re.beforeSanitizeShadowDOM, _, null); N = X.nextNode(); )
      Gt(Re.uponSanitizeShadowNode, N, null), ds(N), Ft(N), N.content instanceof r && W(N.content);
    Gt(Re.afterSanitizeShadowDOM, _, null);
  };
  return t.sanitize = function(W) {
    let _ = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, N = null, X = null, He = null, dt = null;
    if (B = !W, B && (W = "<!-->"), typeof W != "string" && !hs(W))
      if (typeof W.toString == "function") {
        if (W = W.toString(), typeof W != "string")
          throw Ss("dirty is not a string, aborting");
      } else
        throw Ss("toString is not a function");
    if (!t.isSupported)
      return W;
    if (F || Mt(_), t.removed = [], typeof W == "string" && (Z = !1), Z) {
      if (W.nodeName) {
        const At = Xe(W.nodeName);
        if (!oe[At] || q[At])
          throw Ss("root node is forbidden and cannot be sanitized in-place");
      }
    } else if (W instanceof a)
      N = xn("<!---->"), X = N.ownerDocument.importNode(W, !0), X.nodeType === Cs.element && X.nodeName === "BODY" || X.nodeName === "HTML" ? N = X : N.appendChild(X);
    else {
      if (!R && !p && !x && // eslint-disable-next-line unicorn/prefer-includes
      W.indexOf("<") === -1)
        return T && z ? T.createHTML(W) : W;
      if (N = xn(W), !N)
        return R ? null : z ? I : "";
    }
    N && L && xt(N.firstChild);
    const tt = ei(Z ? W : N);
    for (; He = tt.nextNode(); )
      ds(He), Ft(He), He.content instanceof r && Ut(He.content);
    if (Z)
      return W;
    if (R) {
      if (U)
        for (dt = Ae.call(N.ownerDocument); N.firstChild; )
          dt.appendChild(N.firstChild);
      else
        dt = N;
      return (De.shadowroot || De.shadowrootmode) && (dt = Ze.call(s, dt, !0)), dt;
    }
    let qe = x ? N.outerHTML : N.innerHTML;
    return x && oe["!doctype"] && N.ownerDocument && N.ownerDocument.doctype && N.ownerDocument.doctype.name && Tt(Ec, N.ownerDocument.doctype.name) && (qe = "<!DOCTYPE " + N.ownerDocument.doctype.name + `>
` + qe), p && hi([ye, Qe, it], (At) => {
      qe = Ts(qe, At, " ");
    }), T && z ? T.createHTML(qe) : qe;
  }, t.setConfig = function() {
    let W = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Mt(W), F = !0;
  }, t.clearConfig = function() {
    Pt = null, F = !1;
  }, t.isValidAttribute = function(W, _, N) {
    Pt || Mt({});
    const X = Xe(W), He = Xe(_);
    return Dn(X, He, N);
  }, t.addHook = function(W, _) {
    typeof _ == "function" && As(Re[W], _);
  }, t.removeHook = function(W, _) {
    if (_ !== void 0) {
      const N = Rd(Re[W], _);
      return N === -1 ? void 0 : Id(Re[W], N, 1)[0];
    }
    return za(Re[W]);
  }, t.removeHooks = function(W) {
    Re[W] = [];
  }, t.removeAllHooks = function() {
    Re = Ga();
  }, t;
}
var Ro = Cc();
Ro.addHook("uponSanitizeElement", (e, t) => {
  var i, r, o, a, l;
  if (t.tagName === "svg") {
    (i = e.parentNode) == null || i.removeChild(e);
    return;
  }
  if (t.tagName === "math") {
    (r = e.parentNode) == null || r.removeChild(e);
    return;
  }
  if (t.tagName === "foreignobject") {
    (o = e.parentNode) == null || o.removeChild(e);
    return;
  }
  const n = e, s = (a = t.tagName) == null ? void 0 : a.toUpperCase();
  (s === "IMG" || s === "AREA" || s === "MAP") && ((l = n.parentNode) == null || l.removeChild(n));
});
Ro.addHook("afterSanitizeAttributes", (e) => {
  if (e.hasAttribute("href")) {
    const t = e.getAttribute("href") || "";
    try {
      const n = decodeURIComponent(t.toLowerCase());
      (n.includes("javascript:") || n.includes("data:text/html") || n.includes("vbscript:") || n.includes("about:") || n.includes("file:")) && e.removeAttribute("href");
    } catch {
      (t.toLowerCase().includes("javascript:") || t.toLowerCase().includes("data:text/html") || t.toLowerCase().includes("vbscript:") || t.toLowerCase().includes("about:") || t.toLowerCase().includes("file:")) && e.removeAttribute("href");
    }
  }
  if (e.nodeName === "A") {
    const t = (e.getAttribute("href") || "").trim();
    /^(https?:|mailto:)/i.test(t) ? (e.setAttribute("target", "_blank"), e.setAttribute("rel", "noopener noreferrer nofollow")) : e.removeAttribute("href");
  }
  if (e.hasAttribute("src")) {
    const t = e.getAttribute("src") || "";
    try {
      const n = decodeURIComponent(t.toLowerCase());
      (n.includes("javascript:") || n.includes("data:text/html") || n.includes("vbscript:") || n.includes("about:") || n.includes("file:")) && e.removeAttribute("src");
    } catch {
      (t.toLowerCase().includes("javascript:") || t.toLowerCase().includes("data:text/html") || t.toLowerCase().includes("vbscript:") || t.toLowerCase().includes("about:") || t.toLowerCase().includes("file:")) && e.removeAttribute("src");
    }
  }
  if (e.hasAttribute("style")) {
    const t = e.getAttribute("style") || "";
    try {
      const n = decodeURIComponent(t.toLowerCase());
      (n.includes("expression(") || n.includes("behavior:") || n.includes("-moz-binding") || n.includes("import") || n.includes("javascript:") || n.includes("vbscript:")) && e.removeAttribute("style");
    } catch {
      (t.toLowerCase().includes("expression(") || t.toLowerCase().includes("behavior:") || t.toLowerCase().includes("-moz-binding") || t.toLowerCase().includes("import") || t.toLowerCase().includes("javascript:") || t.toLowerCase().includes("vbscript:")) && e.removeAttribute("style");
    }
  }
  Array.from(e.attributes).forEach((t) => {
    t.name.toLowerCase().startsWith("on") && e.removeAttribute(t.name);
  });
});
function Kd(e) {
  const t = {
    // Block all dangerous tags including SVG, form elements and images.
    // NOTE: 'a' must NOT be in this list — FORBID_TAGS beats ALLOWED_TAGS, and
    // anchors are intentionally kept (markdown links) then hardened by the
    // afterSanitizeAttributes hook (http(s)/mailto only, forced target+rel).
    FORBID_TAGS: [
      "iframe",
      "frame",
      "frameset",
      "object",
      "embed",
      "applet",
      "script",
      "base",
      "link",
      "meta",
      "style",
      "svg",
      "math",
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "option",
      "xml",
      "xss",
      "import",
      "video",
      "audio",
      "track",
      "source",
      "canvas",
      "details",
      "template",
      "slot",
      "noscript",
      "marquee",
      "bgsound",
      "keygen",
      "command",
      "img",
      "area",
      "map"
      // SECURITY: Remove image/map tags completely
    ],
    // Block dangerous attributes
    FORBID_ATTR: [
      // Event handlers
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onmouseout",
      "onmousemove",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "ondblclick",
      "oncontextmenu",
      "oninput",
      "oninvalid",
      "onreset",
      "onsearch",
      "onselect",
      "onabort",
      "oncanplay",
      "oncanplaythrough",
      "oncuechange",
      "ondurationchange",
      "onemptied",
      "onended",
      "onloadeddata",
      "onloadedmetadata",
      "onloadstart",
      "onpause",
      "onplay",
      "onplaying",
      "onprogress",
      "onratechange",
      "onseeked",
      "onseeking",
      "onstalled",
      "onsuspend",
      "ontimeupdate",
      "onvolumechange",
      "onwaiting",
      "ontoggle",
      "onauxclick",
      "ongotpointercapture",
      "onlostpointercapture",
      "onpointercancel",
      "onpointerdown",
      "onpointerenter",
      "onpointerleave",
      "onpointermove",
      "onpointerout",
      "onpointerover",
      "onpointerup",
      "onwheel",
      "onanimationcancel",
      "onanimationend",
      "onanimationiteration",
      "onanimationstart",
      "ontransitioncancel",
      "ontransitionend",
      "ontransitionrun",
      "ontransitionstart",
      "ondrag",
      "ondragend",
      "ondragenter",
      "ondragleave",
      "ondragover",
      "ondragstart",
      "ondrop",
      "oncopy",
      "oncut",
      "onpaste",
      "onscroll",
      "onmessage",
      "onmouseenter",
      "onmouseleave",
      "onmousewheel",
      "onbeforeunload",
      "onerrorupdate",
      "onhelp",
      "onmove",
      "onreadystatechange",
      "onresize",
      "onstart",
      "onstop",
      "onunload",
      "onactivate",
      "onafterprint",
      "onafterupdate",
      "onbeforeactivate",
      "onbeforecopy",
      "onbeforecut",
      "onbeforedeactivate",
      "onbeforeeditfocus",
      "onbeforepaste",
      "onbeforeprint",
      "onbeforeupdate",
      "onbounce",
      "oncellchange",
      "oncontrolselect",
      "ondataavailable",
      "ondatasetchanged",
      "ondatasetcomplete",
      "ondeactivate",
      "onfilterchange",
      "onfinish",
      "onfocusin",
      "onfocusout",
      "onlayoutcomplete",
      "onlosecapture",
      "onmoveend",
      "onmovestart",
      "onpropertychange",
      "onresizeend",
      "onresizestart",
      "onrowenter",
      "onrowexit",
      "onrowsdelete",
      "onrowsinserted",
      "onselectionchange",
      "onselectstart",
      "onshow",
      "onsort",
      "onpointerrawupdate",
      // Dangerous attributes
      "formaction",
      "action",
      "form",
      "srcdoc",
      "srcset",
      "dynsrc",
      "lowsrc",
      "ping",
      "poster",
      "background",
      "code",
      "codebase",
      "archive",
      "profile",
      "xmlns",
      "xlink:href",
      "attributename",
      "from",
      "to",
      "values",
      "begin",
      "autofocus",
      "autoplay",
      "controls",
      "manifest",
      "sandbox",
      // SECURITY: block resource-loading attributes. 'href' is intentionally NOT
      // here (FORBID_ATTR beats ALLOWED_ATTR): markdown links need it, and the
      // afterSanitizeAttributes hook strips any href that isn't http(s)/mailto.
      "src",
      "data"
    ],
    // Only allow safe protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // SECURITY: Strip ALL HTML tags to prevent rendering exploits
    // Only allow basic text formatting for markdown (no links, images, or any potentially dangerous tags)
    ALLOWED_TAGS: [
      "a",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
      "del",
      "hr",
      "sup",
      "sub",
      "abbr",
      "cite",
      "dfn",
      "kbd",
      "mark",
      "q",
      "samp",
      "small",
      "time",
      "var"
    ],
    // Allow safe link attributes only (href is protocol-restricted + target/rel are
    // forced by the afterSanitizeAttributes hook above). No src or resource-loading attrs.
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "title",
      "class",
      "id",
      "align",
      "colspan",
      "rowspan"
    ],
    // Return a string instead of a document
    RETURN_DOM: !1,
    RETURN_DOM_FRAGMENT: !1,
    // Keep HTML comments removed
    ALLOW_DATA_ATTR: !1
    // NOTE: do NOT set USE_PROFILES here — it overrides ALLOWED_TAGS/ALLOWED_ATTR,
    // which would drop the <a> tags we explicitly allow above. The explicit
    // ALLOWED_TAGS/ALLOWED_ATTR allowlist is authoritative; protocols are still
    // restricted by the afterSanitizeAttributes hook (href → http/https/mailto only).
  };
  return Ro.sanitize(e, t);
}
Ue.setOptions({
  renderer: new Ue.Renderer(),
  gfm: !0,
  breaks: !0
});
const Ai = (e) => Kd(Ue(e || "")), Gd = { class: "askai" }, Yd = { class: "askai__bar" }, Xd = ["value", "placeholder", "disabled", "aria-label", "onKeydown"], Zd = ["disabled", "title", "aria-label"], Jd = {
  key: 0,
  class: "askai__new-hint"
}, Qd = { class: "askai__intro" }, ep = { class: "askai__title" }, tp = {
  key: 0,
  class: "askai__subtitle"
}, np = {
  key: 0,
  class: "askai__suggestions"
}, sp = ["disabled", "onClick"], ip = ["aria-live"], rp = {
  key: 0,
  class: "askai__question"
}, op = {
  key: 1,
  class: "askai__system"
}, ap = ["innerHTML"], lp = {
  key: 0,
  class: "askai__sources"
}, cp = ["title"], up = {
  key: 0,
  class: "askai__thinking",
  role: "status",
  "aria-live": "polite"
}, fp = { class: "askai__thinking-text" }, hp = { class: "askai__foot" }, dp = { key: 0 }, pp = /* @__PURE__ */ Dl({
  __name: "AskAiPanel",
  props: {
    messages: {},
    draft: {},
    agentName: {},
    suggestions: {},
    welcomeTitle: {},
    welcomeSubtitle: {},
    placeholder: {},
    inputEnabled: { type: Boolean },
    loading: { type: Boolean },
    showCitations: { type: Boolean },
    disclaimer: {},
    active: { type: Boolean },
    hotkey: { type: Boolean },
    citationLabel: { type: Function },
    citationTooltip: { type: Function },
    displayText: { type: Function },
    isStreaming: { type: Function },
    canStartNewChat: { type: Boolean },
    startingNewChat: { type: Boolean },
    newChatArmed: { type: Boolean }
  },
  emits: ["update:draft", "send", "ask", "close", "newChat", "cancelNewChat"],
  setup(e, { emit: t }) {
    const n = e, s = t, i = ie(null), r = ie(null), o = ie(null), a = ["user", "bot", "agent", "system"], l = ce(
      () => n.messages.map((T, I) => ({ message: T, index: I })).filter(({ message: T }) => a.includes(T.message_type))
    ), h = ce(() => l.value.length > 0), c = (T) => {
      s("update:draft", T.target.value);
    }, w = () => {
      !n.inputEnabled || !n.draft.trim() || s("send");
    }, m = (T) => {
      n.inputEnabled && s("ask", T);
    }, P = typeof navigator < "u" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || ""), M = (T) => {
      if (T.key === "Escape") {
        T.preventDefault(), s("close");
        return;
      }
      const I = P ? T.metaKey && !T.ctrlKey : T.ctrlKey && !T.metaKey;
      n.hotkey && I && !T.altKey && (T.key === "k" || T.key === "K") && (T.preventDefault(), s("close"));
    }, K = () => {
      os(() => {
        var T;
        return (T = i.value) == null ? void 0 : T.focus();
      });
    };
    let Pe = 0;
    const fe = () => {
      if (!o.value) return;
      const T = o.value.closest(".askai"), I = r.value;
      if (!T || !I) return;
      const j = T.offsetHeight - I.offsetHeight, G = getComputedStyle(I), Ae = parseFloat(G.paddingTop) + parseFloat(G.paddingBottom), ze = Math.ceil(j + Ae + o.value.getBoundingClientRect().height);
      Math.abs(ze - Pe) < 3 || (Pe = ze, window.parent.postMessage({ type: "WIDGET_RESIZE", height: ze }, "*"));
    };
    let ge = null;
    const ve = ce(
      () => l.value.reduce((T, { message: I, index: j }) => T + n.displayText(j, I.message || "").length, 0)
    );
    return Wt(
      () => [l.value.length, ve.value, n.loading],
      () => os(() => {
        r.value && (r.value.scrollTop = r.value.scrollHeight);
      })
    ), Wt(() => n.active, (T) => {
      T && K();
    }), Yi(() => {
      n.active && K(), window.addEventListener("keydown", M), o.value && typeof ResizeObserver < "u" && (ge = new ResizeObserver(() => fe()), ge.observe(o.value)), fe();
    }), zl(() => {
      window.removeEventListener("keydown", M), ge == null || ge.disconnect(), ge = null;
    }), (T, I) => (k(), A("div", Gd, [
      b("div", Yd, [
        I[5] || (I[5] = b("svg", {
          class: "askai__bar-icon",
          width: "18",
          height: "18",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "1.8",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "aria-hidden": "true"
        }, [
          b("path", { d: "M12 3l1.9 4.9L19 9.8l-4.9 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9L12 3z" })
        ], -1)),
        b("input", {
          ref_key: "inputEl",
          ref: i,
          type: "text",
          class: "askai__input",
          value: T.draft,
          placeholder: T.placeholder,
          disabled: !T.inputEnabled,
          "aria-label": T.placeholder,
          autocomplete: "off",
          spellcheck: "false",
          onInput: c,
          onKeydown: wi(Wn(w, ["prevent"]), ["enter"])
        }, null, 40, Xd),
        T.canStartNewChat ? (k(), A("button", {
          key: 0,
          type: "button",
          class: je(["askai__new", { "askai__new--armed": T.newChatArmed }]),
          disabled: T.startingNewChat,
          title: T.newChatArmed ? "This ends the current chat — click again to confirm" : "Start a new chat",
          "aria-label": T.newChatArmed ? "Confirm starting a new chat" : "Start a new chat",
          onClick: I[0] || (I[0] = (j) => s("newChat")),
          onBlur: I[1] || (I[1] = (j) => s("cancelNewChat"))
        }, [
          I[3] || (I[3] = b("svg", {
            width: "15",
            height: "15",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "aria-hidden": "true"
          }, [
            b("path", { d: "M12 20h9" }),
            b("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
          ], -1)),
          T.newChatArmed ? (k(), A("span", Jd, "Click again to confirm")) : se("", !0)
        ], 42, Zd)) : se("", !0),
        b("button", {
          type: "button",
          class: "askai__close",
          "aria-label": "Close",
          title: "Close (Esc)",
          onClick: I[2] || (I[2] = (j) => s("close"))
        }, I[4] || (I[4] = [
          b("span", { class: "askai__kbd" }, "Esc", -1)
        ]))
      ]),
      b("div", {
        ref_key: "bodyEl",
        ref: r,
        class: "askai__body"
      }, [
        b("div", {
          ref_key: "contentEl",
          ref: o,
          class: "askai__content"
        }, [
          h.value ? (k(), A($e, { key: 1 }, [
            (k(!0), A($e, null, mt(l.value, ({ message: j, index: G }) => (k(), A("div", {
              key: G,
              class: "askai__turn",
              "aria-live": T.isStreaming(G) ? "off" : "polite"
            }, [
              j.message_type === "user" ? (k(), A("p", rp, ee(j.message), 1)) : j.message_type === "system" ? (k(), A("p", op, ee(j.message), 1)) : (k(), A($e, { key: 2 }, [
                b("div", {
                  class: je(["askai__answer", { "askai__answer--streaming": T.isStreaming(G) }]),
                  innerHTML: E(Ai)(T.isStreaming(G) ? T.displayText(G, j.message || "") : j.message || "")
                }, null, 10, ap),
                T.showCitations && !T.isStreaming(G) && j.sources && j.sources.length ? (k(), A("div", lp, [
                  I[8] || (I[8] = b("span", { class: "askai__label" }, "Sources", -1)),
                  (k(!0), A($e, null, mt(j.sources, (Ae, ze) => (k(), A("span", {
                    key: ze,
                    class: "askai__source",
                    title: T.citationTooltip(Ae)
                  }, ee(T.citationLabel(Ae)), 9, cp))), 128))
                ])) : se("", !0)
              ], 64))
            ], 8, ip))), 128)),
            T.loading ? (k(), A("div", up, [
              I[9] || (I[9] = b("span", { class: "askai__dot" }, null, -1)),
              I[10] || (I[10] = b("span", { class: "askai__dot" }, null, -1)),
              I[11] || (I[11] = b("span", { class: "askai__dot" }, null, -1)),
              b("span", fp, ee(T.showCitations ? "Searching the knowledge base" : "Thinking"), 1)
            ])) : se("", !0)
          ], 64)) : (k(), A($e, { key: 0 }, [
            b("div", Qd, [
              b("h2", ep, ee(T.welcomeTitle || `Ask ${T.agentName}`), 1),
              T.welcomeSubtitle ? (k(), A("p", tp, ee(T.welcomeSubtitle), 1)) : se("", !0)
            ]),
            T.suggestions.length && !T.draft.trim() ? (k(), A("div", np, [
              I[7] || (I[7] = b("p", { class: "askai__label" }, "Suggested", -1)),
              (k(!0), A($e, null, mt(T.suggestions, (j) => (k(), A("button", {
                key: j,
                type: "button",
                class: "askai__suggestion",
                disabled: !T.inputEnabled,
                onClick: (G) => m(j)
              }, [
                b("span", null, ee(j), 1),
                I[6] || (I[6] = b("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "aria-hidden": "true"
                }, [
                  b("path", { d: "M5 12h14M13 6l6 6-6 6" })
                ], -1))
              ], 8, sp))), 128))
            ])) : se("", !0)
          ], 64))
        ], 512)
      ], 512),
      b("div", hp, [
        T.disclaimer ? (k(), A("span", dp, ee(T.disclaimer), 1)) : se("", !0),
        I[12] || (I[12] = b("a", {
          class: "askai__brand",
          href: "https://chattermate.chat",
          target: "_blank",
          rel: "noopener noreferrer"
        }, "Powered by ChatterMate", -1))
      ])
    ]));
  }
}), Rc = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [s, i] of t)
    n[s] = i;
  return n;
}, gp = /* @__PURE__ */ Rc(pp, [["__scopeId", "data-v-93559d14"]]), Os = [
  { stops: "#9D8CFF, #5FE3D6, #C9F24E", glow: "rgba(157,140,255,0.45)" },
  // aurora (default)
  { stops: "#FF8A73, #9D8CFF, #5FE3D6", glow: "rgba(255,138,115,0.40)" },
  // coral
  { stops: "#5FE3D6, #C9F24E, #9D8CFF", glow: "rgba(95,227,214,0.40)" },
  // teal
  { stops: "#C9F24E, #5FE3D6, #FF8A73", glow: "rgba(201,242,78,0.35)" },
  // lime
  { stops: "#6EA8FF, #9D8CFF, #5FE3D6", glow: "rgba(110,168,255,0.42)" },
  // blue
  { stops: "#FF7AC6, #9D8CFF, #6EA8FF", glow: "rgba(255,122,198,0.42)" },
  // pink
  { stops: "#FF8A73, #FFC857, #FF7AC6", glow: "rgba(255,200,87,0.40)" },
  // sunset
  { stops: "#7C5CFF, #B388FF, #5FE3D6", glow: "rgba(124,92,255,0.45)" },
  // violet
  { stops: "#0EA5A5, #5FE3D6, #C9F24E", glow: "rgba(14,165,165,0.40)" },
  // emerald
  { stops: "#F34611, #FF8A73, #FFC857", glow: "rgba(243,70,17,0.38)" }
  // ember
], mp = (e) => (e || "").split("").reduce((t, n) => t + n.charCodeAt(0), 0) % Os.length, _p = (e) => {
  const t = Os[(e % Os.length + Os.length) % Os.length];
  return {
    background: `
            radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, transparent 42%),
            radial-gradient(circle at 68% 72%, rgba(0,0,0,0.25) 0%, transparent 38%),
            radial-gradient(ellipse at 50% 50%, ${t.stops})
        `.trim(),
    boxShadow: `0 4px 28px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    borderRadius: "50%"
  };
}, yp = (e, t) => {
  const n = typeof t == "number" && Number.isFinite(t) ? t : mp(e);
  return _p(n);
}, Ya = (e) => {
  var t;
  return !!((t = e == null ? void 0 : e.attributes) != null && t.end_chat);
}, Xa = "AI can make mistakes. Check important info.";
function vp(e, t = !1) {
  return e !== !1 && !t;
}
const Ic = (e) => !!e && (/^https?:\/\//i.test(e) || e.startsWith("data:")), bp = (e, t) => e ? Ic(e) || e.startsWith("blob:") ? e : `${t.replace(/\/api\/v1\/?$/, "")}${e.startsWith("/") ? "" : "/"}${e}` : "";
function Za() {
  return typeof window < "u" && window.APP_CONFIG ? window.APP_CONFIG : {};
}
const Ks = {
  get API_URL() {
    return Za().API_URL || "https://api.chattermate.chat/api/v1";
  },
  get WS_URL() {
    return Za().WS_URL || "wss://api.chattermate.chat";
  }
};
function Ui(e) {
  return bp(e, Ks.API_URL);
}
function wp(e) {
  const t = ce(() => ({
    backgroundColor: "var(--cm-card)",
    color: "var(--cm-text)"
  })), n = ce(() => ({
    backgroundColor: e.value.chat_bubble_color || "#C9F24E",
    color: ls(e.value.chat_bubble_color || "#C9F24E") ? "#FFFFFF" : "#000000"
  })), s = ce(() => ({
    backgroundColor: "var(--cm-agent-bg)",
    color: "var(--cm-text)"
  })), i = ce(() => ({
    backgroundColor: "var(--cm-accent)",
    color: "var(--cm-on-accent)"
  })), r = ce(() => ({
    color: "var(--cm-text)"
  })), o = ce(() => ({
    borderBottom: "1px solid var(--cm-hairline)"
  })), a = ce(() => Ui(e.value.photo_url)), l = ce(() => {
    const h = e.value.chat_background_color || "#ffffff";
    return {
      boxShadow: `0 8px 5px ${ls(h) ? "rgba(0, 0, 0, 0.24)" : "rgba(0, 0, 0, 0.12)"}`
    };
  });
  return {
    chatStyles: t,
    chatIconStyles: n,
    agentBubbleStyles: s,
    userBubbleStyles: i,
    messageNameStyles: r,
    headerBorderStyles: o,
    photoUrl: a,
    shadowStyle: l
  };
}
const kp = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]), xp = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
[...kp, ...xp];
function Ap(e, t) {
  const n = ie([]), s = ie(!1), i = ie(null), r = (I) => {
    if (I === 0) return "0 Bytes";
    const j = 1024, G = ["Bytes", "KB", "MB", "GB"], Ae = Math.floor(Math.log(I) / Math.log(j));
    return parseFloat((I / Math.pow(j, Ae)).toFixed(2)) + " " + G[Ae];
  }, o = (I) => I.startsWith("image/"), a = (I) => I ? Ui(I) : "", l = (I) => {
    const j = I.file_url || I.url;
    return j ? Ui(j) : "";
  }, h = async (I) => {
    const j = I.target;
    j.files && j.files.length > 0 && (await K(Array.from(j.files)), j.value = "");
  }, c = async (I) => {
    var G;
    I.preventDefault();
    const j = (G = I.dataTransfer) == null ? void 0 : G.files;
    j && j.length > 0 && await K(Array.from(j));
  }, w = (I) => {
    I.preventDefault();
  }, m = (I) => {
    I.preventDefault();
  }, P = async (I) => {
    var Ae;
    const j = (Ae = I.clipboardData) == null ? void 0 : Ae.items;
    if (!j) return;
    const G = [];
    for (const ze of Array.from(j))
      if (ze.kind === "file") {
        const Ze = ze.getAsFile();
        Ze && G.push(Ze);
      }
    G.length > 0 && await K(G);
  }, M = async (I, j = 500) => new Promise((G, Ae) => {
    const ze = new FileReader();
    ze.onload = (Ze) => {
      var ye;
      const Re = new Image();
      Re.onload = () => {
        const Qe = document.createElement("canvas");
        let it = Re.width, lt = Re.height;
        const ue = 1920;
        (it > ue || lt > ue) && (it > lt ? (lt = lt / it * ue, it = ue) : (it = it / lt * ue, lt = ue)), Qe.width = it, Qe.height = lt;
        const de = Qe.getContext("2d");
        if (!de) {
          Ae(new Error("Failed to get canvas context"));
          return;
        }
        de.drawImage(Re, 0, 0, it, lt);
        let ae = 0.9;
        const Se = () => {
          Qe.toBlob((rt) => {
            if (!rt) {
              Ae(new Error("Failed to compress image"));
              return;
            }
            if (rt.size / 1024 > j && ae > 0.3)
              ae -= 0.1, Se();
            else {
              const Me = new FileReader();
              Me.onload = () => {
                const De = Me.result.split(",")[1];
                G({ blob: rt, base64: De });
              }, Me.readAsDataURL(rt);
            }
          }, I.type === "image/png" ? "image/png" : "image/jpeg", ae);
        };
        Se();
      }, Re.onerror = () => Ae(new Error("Failed to load image")), Re.src = (ye = Ze.target) == null ? void 0 : ye.result;
    }, ze.onerror = () => Ae(new Error("Failed to read file")), ze.readAsDataURL(I);
  }), K = async (I) => {
    if (n.value.length >= 3) {
      alert("Maximum 3 files allowed per message");
      return;
    }
    const Ze = 3 - n.value.length, Re = I.slice(0, Ze);
    I.length > Ze && alert(`Only ${Ze} more file(s) can be uploaded. Maximum 3 files per message.`);
    for (const ye of Re)
      try {
        if (n.value.some((ue) => ue.filename === ye.name)) {
          console.warn(`File ${ye.name} is already selected`), alert(`File "${ye.name}" is already selected`);
          continue;
        }
        const it = ye.type.startsWith("image/"), lt = it ? 5242880 : 10485760;
        if (ye.size > lt) {
          const ue = lt / 1048576;
          console.error(`File ${ye.name} is too large. Maximum size is ${ue}MB`), alert(`File "${ye.name}" is too large. Maximum size for ${it ? "images" : "documents"} is ${ue}MB`);
          continue;
        }
        if (it)
          try {
            const { blob: ue, base64: de } = await M(ye, 500), ae = ue.size;
            console.log(`Compressed ${ye.name}: ${(ye.size / 1024).toFixed(2)}KB → ${(ae / 1024).toFixed(2)}KB`), n.value.push({
              content: de,
              filename: ye.name,
              type: ye.type,
              size: ae,
              url: URL.createObjectURL(ue),
              file_url: URL.createObjectURL(ue)
            });
          } catch (ue) {
            console.error("Image compression failed, uploading original:", ue);
            const de = new FileReader();
            de.onload = (ae) => {
              var oe;
              const rt = ((oe = ae.target) == null ? void 0 : oe.result).split(",")[1];
              n.value.push({
                content: rt,
                filename: ye.name,
                type: ye.type,
                size: ye.size,
                url: URL.createObjectURL(ye),
                file_url: URL.createObjectURL(ye)
              });
            }, de.readAsDataURL(ye);
          }
        else {
          const ue = new FileReader();
          ue.onload = (de) => {
            var rt;
            const Se = ((rt = de.target) == null ? void 0 : rt.result).split(",")[1];
            n.value.push({
              content: Se,
              filename: ye.name,
              type: ye.type || "application/octet-stream",
              size: ye.size,
              url: "",
              file_url: ""
            });
          }, ue.readAsDataURL(ye);
        }
      } catch (Qe) {
        console.error("File upload error:", Qe);
      }
  };
  return {
    uploadedAttachments: n,
    previewModal: s,
    previewFile: i,
    formatFileSize: r,
    isImageAttachment: o,
    getDownloadUrl: a,
    getPreviewUrl: l,
    handleFileSelect: h,
    handleDrop: c,
    handleDragOver: w,
    handleDragLeave: m,
    handlePaste: P,
    uploadFiles: K,
    removeAttachment: async (I) => {
      const j = n.value[I];
      if (j) {
        try {
          let G = j.url;
          if (G.startsWith("/uploads/") ? G = G.substring(9) : G.startsWith("/") && (G = G.substring(1)), Ic(G))
            try {
              G = new URL(G).pathname.replace(/^\/+/, "");
            } catch {
            }
          const Ae = {};
          e.value && (Ae.Authorization = `Bearer ${e.value}`);
          const ze = await fetch(`${Ks.API_URL}/files/upload/${G}`, {
            method: "DELETE",
            headers: Ae
          });
          if (ze.ok)
            console.log("File deleted successfully from backend.");
          else {
            const Ze = await ze.json();
            console.error("Failed to delete file:", Ze.detail);
          }
        } catch (G) {
          console.error("Error calling delete API:", G);
        }
        j.url && j.url.startsWith("blob:") && URL.revokeObjectURL(j.url), j.file_url && j.file_url.startsWith("blob:") && URL.revokeObjectURL(j.file_url), n.value.splice(I, 1);
      }
    },
    openPreview: (I) => {
      i.value = I, s.value = !0;
    },
    closePreview: () => {
      s.value = !1, setTimeout(() => {
        i.value = null;
      }, 300);
    },
    openFilePicker: () => {
      var I;
      (I = t.value) == null || I.click();
    },
    isImage: (I) => I.startsWith("image/")
  };
}
const un = /* @__PURE__ */ Object.create(null);
un.open = "0";
un.close = "1";
un.ping = "2";
un.pong = "3";
un.message = "4";
un.upgrade = "5";
un.noop = "6";
const Ti = /* @__PURE__ */ Object.create(null);
Object.keys(un).forEach((e) => {
  Ti[un[e]] = e;
});
const Zr = { type: "error", data: "parser error" }, Lc = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", Oc = typeof ArrayBuffer == "function", Nc = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, Io = ({ type: e, data: t }, n, s) => Lc && t instanceof Blob ? n ? s(t) : Ja(t, s) : Oc && (t instanceof ArrayBuffer || Nc(t)) ? n ? s(t) : Ja(new Blob([t]), s) : s(un[e] + (t || "")), Ja = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const s = n.result.split(",")[1];
    t("b" + (s || ""));
  }, n.readAsDataURL(e);
};
function Qa(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let Rr;
function Tp(e, t) {
  if (Lc && e.data instanceof Blob)
    return e.data.arrayBuffer().then(Qa).then(t);
  if (Oc && (e.data instanceof ArrayBuffer || Nc(e.data)))
    return t(Qa(e.data));
  Io(e, !1, (n) => {
    Rr || (Rr = new TextEncoder()), t(Rr.encode(n));
  });
}
const el = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Ns = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < el.length; e++)
  Ns[el.charCodeAt(e)] = e;
const Sp = (e) => {
  let t = e.length * 0.75, n = e.length, s, i = 0, r, o, a, l;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const h = new ArrayBuffer(t), c = new Uint8Array(h);
  for (s = 0; s < n; s += 4)
    r = Ns[e.charCodeAt(s)], o = Ns[e.charCodeAt(s + 1)], a = Ns[e.charCodeAt(s + 2)], l = Ns[e.charCodeAt(s + 3)], c[i++] = r << 2 | o >> 4, c[i++] = (o & 15) << 4 | a >> 2, c[i++] = (a & 3) << 6 | l & 63;
  return h;
}, Ep = typeof ArrayBuffer == "function", Lo = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: Pc(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: Cp(e.substring(1), t)
  } : Ti[n] ? e.length > 1 ? {
    type: Ti[n],
    data: e.substring(1)
  } : {
    type: Ti[n]
  } : Zr;
}, Cp = (e, t) => {
  if (Ep) {
    const n = Sp(e);
    return Pc(n, t);
  } else
    return { base64: !0, data: e };
}, Pc = (e, t) => {
  switch (t) {
    case "blob":
      return e instanceof Blob ? e : new Blob([e]);
    case "arraybuffer":
    default:
      return e instanceof ArrayBuffer ? e : e.buffer;
  }
}, Mc = "", Rp = (e, t) => {
  const n = e.length, s = new Array(n);
  let i = 0;
  e.forEach((r, o) => {
    Io(r, !1, (a) => {
      s[o] = a, ++i === n && t(s.join(Mc));
    });
  });
}, Ip = (e, t) => {
  const n = e.split(Mc), s = [];
  for (let i = 0; i < n.length; i++) {
    const r = Lo(n[i], t);
    if (s.push(r), r.type === "error")
      break;
  }
  return s;
};
function Lp() {
  return new TransformStream({
    transform(e, t) {
      Tp(e, (n) => {
        const s = n.length;
        let i;
        if (s < 126)
          i = new Uint8Array(1), new DataView(i.buffer).setUint8(0, s);
        else if (s < 65536) {
          i = new Uint8Array(3);
          const r = new DataView(i.buffer);
          r.setUint8(0, 126), r.setUint16(1, s);
        } else {
          i = new Uint8Array(9);
          const r = new DataView(i.buffer);
          r.setUint8(0, 127), r.setBigUint64(1, BigInt(s));
        }
        e.data && typeof e.data != "string" && (i[0] |= 128), t.enqueue(i), t.enqueue(n);
      });
    }
  });
}
let Ir;
function pi(e) {
  return e.reduce((t, n) => t + n.length, 0);
}
function gi(e, t) {
  if (e[0].length === t)
    return e.shift();
  const n = new Uint8Array(t);
  let s = 0;
  for (let i = 0; i < t; i++)
    n[i] = e[0][s++], s === e[0].length && (e.shift(), s = 0);
  return e.length && s < e[0].length && (e[0] = e[0].slice(s)), n;
}
function Op(e, t) {
  Ir || (Ir = new TextDecoder());
  const n = [];
  let s = 0, i = -1, r = !1;
  return new TransformStream({
    transform(o, a) {
      for (n.push(o); ; ) {
        if (s === 0) {
          if (pi(n) < 1)
            break;
          const l = gi(n, 1);
          r = (l[0] & 128) === 128, i = l[0] & 127, i < 126 ? s = 3 : i === 126 ? s = 1 : s = 2;
        } else if (s === 1) {
          if (pi(n) < 2)
            break;
          const l = gi(n, 2);
          i = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0), s = 3;
        } else if (s === 2) {
          if (pi(n) < 8)
            break;
          const l = gi(n, 8), h = new DataView(l.buffer, l.byteOffset, l.length), c = h.getUint32(0);
          if (c > Math.pow(2, 21) - 1) {
            a.enqueue(Zr);
            break;
          }
          i = c * Math.pow(2, 32) + h.getUint32(4), s = 3;
        } else {
          if (pi(n) < i)
            break;
          const l = gi(n, i);
          a.enqueue(Lo(r ? l : Ir.decode(l), t)), s = 0;
        }
        if (i === 0 || i > e) {
          a.enqueue(Zr);
          break;
        }
      }
    }
  });
}
const Fc = 4;
function ut(e) {
  if (e) return Np(e);
}
function Np(e) {
  for (var t in ut.prototype)
    e[t] = ut.prototype[t];
  return e;
}
ut.prototype.on = ut.prototype.addEventListener = function(e, t) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t), this;
};
ut.prototype.once = function(e, t) {
  function n() {
    this.off(e, n), t.apply(this, arguments);
  }
  return n.fn = t, this.on(e, n), this;
};
ut.prototype.off = ut.prototype.removeListener = ut.prototype.removeAllListeners = ut.prototype.removeEventListener = function(e, t) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var n = this._callbacks["$" + e];
  if (!n) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + e], this;
  for (var s, i = 0; i < n.length; i++)
    if (s = n[i], s === t || s.fn === t) {
      n.splice(i, 1);
      break;
    }
  return n.length === 0 && delete this._callbacks["$" + e], this;
};
ut.prototype.emit = function(e) {
  this._callbacks = this._callbacks || {};
  for (var t = new Array(arguments.length - 1), n = this._callbacks["$" + e], s = 1; s < arguments.length; s++)
    t[s - 1] = arguments[s];
  if (n) {
    n = n.slice(0);
    for (var s = 0, i = n.length; s < i; ++s)
      n[s].apply(this, t);
  }
  return this;
};
ut.prototype.emitReserved = ut.prototype.emit;
ut.prototype.listeners = function(e) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + e] || [];
};
ut.prototype.hasListeners = function(e) {
  return !!this.listeners(e).length;
};
const tr = typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0), Ht = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Pp = "arraybuffer";
function Dc(e, ...t) {
  return t.reduce((n, s) => (e.hasOwnProperty(s) && (n[s] = e[s]), n), {});
}
const Mp = Ht.setTimeout, Fp = Ht.clearTimeout;
function nr(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = Mp.bind(Ht), e.clearTimeoutFn = Fp.bind(Ht)) : (e.setTimeoutFn = Ht.setTimeout.bind(Ht), e.clearTimeoutFn = Ht.clearTimeout.bind(Ht));
}
const Dp = 1.33;
function Bp(e) {
  return typeof e == "string" ? $p(e) : Math.ceil((e.byteLength || e.size) * Dp);
}
function $p(e) {
  let t = 0, n = 0;
  for (let s = 0, i = e.length; s < i; s++)
    t = e.charCodeAt(s), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (s++, n += 4);
  return n;
}
function Bc() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function Up(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function zp(e) {
  let t = {}, n = e.split("&");
  for (let s = 0, i = n.length; s < i; s++) {
    let r = n[s].split("=");
    t[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
  }
  return t;
}
class Hp extends Error {
  constructor(t, n, s) {
    super(t), this.description = n, this.context = s, this.type = "TransportError";
  }
}
class Oo extends ut {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(t) {
    super(), this.writable = !1, nr(this, t), this.opts = t, this.query = t.query, this.socket = t.socket, this.supportsBinary = !t.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(t, n, s) {
    return super.emitReserved("error", new Hp(t, n, s)), this;
  }
  /**
   * Opens the transport.
   */
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  /**
   * Closes the transport.
   */
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(t) {
    this.readyState === "open" && this.write(t);
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(t) {
    const n = Lo(t, this.socket.binaryType);
    this.onPacket(n);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(t) {
    super.emitReserved("packet", t);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(t) {
    this.readyState = "closed", super.emitReserved("close", t);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(t) {
  }
  createUri(t, n = {}) {
    return t + "://" + this._hostname() + this._port() + this.opts.path + this._query(n);
  }
  _hostname() {
    const t = this.opts.hostname;
    return t.indexOf(":") === -1 ? t : "[" + t + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && +(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(t) {
    const n = Up(t);
    return n.length ? "?" + n : "";
  }
}
class qp extends Oo {
  constructor() {
    super(...arguments), this._polling = !1;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(t) {
    this.readyState = "pausing";
    const n = () => {
      this.readyState = "paused", t();
    };
    if (this._polling || !this.writable) {
      let s = 0;
      this._polling && (s++, this.once("pollComplete", function() {
        --s || n();
      })), this.writable || (s++, this.once("drain", function() {
        --s || n();
      }));
    } else
      n();
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(t) {
    const n = (s) => {
      if (this.readyState === "opening" && s.type === "open" && this.onOpen(), s.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(s);
    };
    Ip(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const t = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? t() : this.once("open", t);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(t) {
    this.writable = !1, Rp(t, (n) => {
      this.doWrite(n, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const t = this.opts.secure ? "https" : "http", n = this.query || {};
    return this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = Bc()), !this.supportsBinary && !n.sid && (n.b64 = 1), this.createUri(t, n);
  }
}
let $c = !1;
try {
  $c = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Wp = $c;
function jp() {
}
class Vp extends qp {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(t) {
    if (super(t), typeof location < "u") {
      const n = location.protocol === "https:";
      let s = location.port;
      s || (s = n ? "443" : "80"), this.xd = typeof location < "u" && t.hostname !== location.hostname || s !== t.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(t, n) {
    const s = this.request({
      method: "POST",
      data: t
    });
    s.on("success", n), s.on("error", (i, r) => {
      this.onError("xhr post error", i, r);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const t = this.request();
    t.on("data", this.onData.bind(this)), t.on("error", (n, s) => {
      this.onError("xhr poll error", n, s);
    }), this.pollXhr = t;
  }
}
class ln extends ut {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(t, n, s) {
    super(), this.createRequest = t, nr(this, s), this._opts = s, this._method = s.method || "GET", this._uri = n, this._data = s.data !== void 0 ? s.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var t;
    const n = Dc(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    n.xdomain = !!this._opts.xd;
    const s = this._xhr = this.createRequest(n);
    try {
      s.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          s.setDisableHeaderCheck && s.setDisableHeaderCheck(!0);
          for (let i in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(i) && s.setRequestHeader(i, this._opts.extraHeaders[i]);
        }
      } catch {
      }
      if (this._method === "POST")
        try {
          s.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        s.setRequestHeader("Accept", "*/*");
      } catch {
      }
      (t = this._opts.cookieJar) === null || t === void 0 || t.addCookies(s), "withCredentials" in s && (s.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (s.timeout = this._opts.requestTimeout), s.onreadystatechange = () => {
        var i;
        s.readyState === 3 && ((i = this._opts.cookieJar) === null || i === void 0 || i.parseCookies(
          // @ts-ignore
          s.getResponseHeader("set-cookie")
        )), s.readyState === 4 && (s.status === 200 || s.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof s.status == "number" ? s.status : 0);
        }, 0));
      }, s.send(this._data);
    } catch (i) {
      this.setTimeoutFn(() => {
        this._onError(i);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = ln.requestsCount++, ln.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(t) {
    this.emitReserved("error", t, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(t) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = jp, t)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete ln.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const t = this._xhr.responseText;
    t !== null && (this.emitReserved("data", t), this.emitReserved("success"), this._cleanup());
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
ln.requestsCount = 0;
ln.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", tl);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in Ht ? "pagehide" : "unload";
    addEventListener(e, tl, !1);
  }
}
function tl() {
  for (let e in ln.requests)
    ln.requests.hasOwnProperty(e) && ln.requests[e].abort();
}
const Kp = function() {
  const e = Uc({
    xdomain: !1
  });
  return e && e.responseType !== null;
}();
class Gp extends Vp {
  constructor(t) {
    super(t);
    const n = t && t.forceBase64;
    this.supportsBinary = Kp && !n;
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd }, this.opts), new ln(Uc, this.uri(), t);
  }
}
function Uc(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || Wp))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new Ht[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const zc = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class Yp extends Oo {
  get name() {
    return "websocket";
  }
  doOpen() {
    const t = this.uri(), n = this.opts.protocols, s = zc ? {} : Dc(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (s.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(t, n, s);
    } catch (i) {
      return this.emitReserved("error", i);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (t) => this.onClose({
      description: "websocket connection closed",
      context: t
    }), this.ws.onmessage = (t) => this.onData(t.data), this.ws.onerror = (t) => this.onError("websocket error", t);
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const s = t[n], i = n === t.length - 1;
      Io(s, this.supportsBinary, (r) => {
        try {
          this.doWrite(s, r);
        } catch {
        }
        i && tr(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.onerror = () => {
    }, this.ws.close(), this.ws = null);
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const t = this.opts.secure ? "wss" : "ws", n = this.query || {};
    return this.opts.timestampRequests && (n[this.opts.timestampParam] = Bc()), this.supportsBinary || (n.b64 = 1), this.createUri(t, n);
  }
}
const Lr = Ht.WebSocket || Ht.MozWebSocket;
class Xp extends Yp {
  createSocket(t, n, s) {
    return zc ? new Lr(t, n, s) : n ? new Lr(t, n) : new Lr(t);
  }
  doWrite(t, n) {
    this.ws.send(n);
  }
}
class Zp extends Oo {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (t) {
      return this.emitReserved("error", t);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((t) => {
      this.onError("webtransport error", t);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((t) => {
        const n = Op(Number.MAX_SAFE_INTEGER, this.socket.binaryType), s = t.readable.pipeThrough(n).getReader(), i = Lp();
        i.readable.pipeTo(t.writable), this._writer = i.writable.getWriter();
        const r = () => {
          s.read().then(({ done: a, value: l }) => {
            a || (this.onPacket(l), r());
          }).catch((a) => {
          });
        };
        r();
        const o = { type: "open" };
        this.query.sid && (o.data = `{"sid":"${this.query.sid}"}`), this._writer.write(o).then(() => this.onOpen());
      });
    });
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const s = t[n], i = n === t.length - 1;
      this._writer.write(s).then(() => {
        i && tr(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var t;
    (t = this._transport) === null || t === void 0 || t.close();
  }
}
const Jp = {
  websocket: Xp,
  webtransport: Zp,
  polling: Gp
}, Qp = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, eg = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function Jr(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const t = e, n = e.indexOf("["), s = e.indexOf("]");
  n != -1 && s != -1 && (e = e.substring(0, n) + e.substring(n, s).replace(/:/g, ";") + e.substring(s, e.length));
  let i = Qp.exec(e || ""), r = {}, o = 14;
  for (; o--; )
    r[eg[o]] = i[o] || "";
  return n != -1 && s != -1 && (r.source = t, r.host = r.host.substring(1, r.host.length - 1).replace(/;/g, ":"), r.authority = r.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r.ipv6uri = !0), r.pathNames = tg(r, r.path), r.queryKey = ng(r, r.query), r;
}
function tg(e, t) {
  const n = /\/{2,9}/g, s = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && s.splice(0, 1), t.slice(-1) == "/" && s.splice(s.length - 1, 1), s;
}
function ng(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(s, i, r) {
    i && (n[i] = r);
  }), n;
}
const Qr = typeof addEventListener == "function" && typeof removeEventListener == "function", Si = [];
Qr && addEventListener("offline", () => {
  Si.forEach((e) => e());
}, !1);
class Ln extends ut {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(t, n) {
    if (super(), this.binaryType = Pp, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, t && typeof t == "object" && (n = t, t = null), t) {
      const s = Jr(t);
      n.hostname = s.host, n.secure = s.protocol === "https" || s.protocol === "wss", n.port = s.port, s.query && (n.query = s.query);
    } else n.host && (n.hostname = Jr(n.host).host);
    nr(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, n.transports.forEach((s) => {
      const i = s.prototype.name;
      this.transports.push(i), this._transportsByName[i] = s;
    }), this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      addTrailingSlash: !0,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !1
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = zp(this.opts.query)), Qr && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, Si.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(t) {
    const n = Object.assign({}, this.opts.query);
    n.EIO = Fc, n.transport = t, this.id && (n.sid = this.id);
    const s = Object.assign({}, this.opts, {
      query: n,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[t]);
    return new this._transportsByName[t](s);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const t = this.opts.rememberUpgrade && Ln.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const n = this.createTransport(t);
    n.open(), this.setTransport(n);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(t) {
    this.transport && this.transport.removeAllListeners(), this.transport = t, t.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (n) => this._onClose("transport close", n));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", Ln.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", t), this.emitReserved("heartbeat"), t.type) {
        case "open":
          this.onHandshake(JSON.parse(t.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const n = new Error("server error");
          n.code = t.data, this._onError(n);
          break;
        case "message":
          this.emitReserved("data", t.data), this.emitReserved("message", t.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(t) {
    this.emitReserved("handshake", t), this.id = t.sid, this.transport.query.sid = t.sid, this._pingInterval = t.pingInterval, this._pingTimeout = t.pingTimeout, this._maxPayload = t.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const t = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + t, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, t), this.opts.autoUnref && this._pingTimeoutTimer.unref();
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen), this._prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const t = this._getWritablePackets();
      this.transport.send(t), this._prevBufferLen = t.length, this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let n = 1;
    for (let s = 0; s < this.writeBuffer.length; s++) {
      const i = this.writeBuffer[s].data;
      if (i && (n += Bp(i)), s > 0 && n > this._maxPayload)
        return this.writeBuffer.slice(0, s);
      n += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return !0;
    const t = Date.now() > this._pingTimeoutTime;
    return t && (this._pingTimeoutTime = 0, tr(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), t;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(t, n, s) {
    return this._sendPacket("message", t, n, s), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(t, n, s) {
    return this._sendPacket("message", t, n, s), this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(t, n, s, i) {
    if (typeof n == "function" && (i = n, n = void 0), typeof s == "function" && (i = s, s = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    s = s || {}, s.compress = s.compress !== !1;
    const r = {
      type: t,
      data: n,
      options: s
    };
    this.emitReserved("packetCreate", r), this.writeBuffer.push(r), i && this.once("flush", i), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const t = () => {
      this._onClose("forced close"), this.transport.close();
    }, n = () => {
      this.off("upgrade", n), this.off("upgradeError", n), t();
    }, s = () => {
      this.once("upgrade", n), this.once("upgradeError", n);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? s() : t();
    }) : this.upgrading ? s() : t()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(t) {
    if (Ln.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", t), this._onClose("transport error", t);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(t, n) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), Qr && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const s = Si.indexOf(this._offlineEventListener);
        s !== -1 && Si.splice(s, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
Ln.protocol = Fc;
class sg extends Ln {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let t = 0; t < this._upgrades.length; t++)
        this._probe(this._upgrades[t]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(t) {
    let n = this.createTransport(t), s = !1;
    Ln.priorWebsocketSuccess = !1;
    const i = () => {
      s || (n.send([{ type: "ping", data: "probe" }]), n.once("packet", (w) => {
        if (!s)
          if (w.type === "pong" && w.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", n), !n)
              return;
            Ln.priorWebsocketSuccess = n.name === "websocket", this.transport.pause(() => {
              s || this.readyState !== "closed" && (c(), this.setTransport(n), n.send([{ type: "upgrade" }]), this.emitReserved("upgrade", n), n = null, this.upgrading = !1, this.flush());
            });
          } else {
            const m = new Error("probe error");
            m.transport = n.name, this.emitReserved("upgradeError", m);
          }
      }));
    };
    function r() {
      s || (s = !0, c(), n.close(), n = null);
    }
    const o = (w) => {
      const m = new Error("probe error: " + w);
      m.transport = n.name, r(), this.emitReserved("upgradeError", m);
    };
    function a() {
      o("transport closed");
    }
    function l() {
      o("socket closed");
    }
    function h(w) {
      n && w.name !== n.name && r();
    }
    const c = () => {
      n.removeListener("open", i), n.removeListener("error", o), n.removeListener("close", a), this.off("close", l), this.off("upgrading", h);
    };
    n.once("open", i), n.once("error", o), n.once("close", a), this.once("close", l), this.once("upgrading", h), this._upgrades.indexOf("webtransport") !== -1 && t !== "webtransport" ? this.setTimeoutFn(() => {
      s || n.open();
    }, 200) : n.open();
  }
  onHandshake(t) {
    this._upgrades = this._filterUpgrades(t.upgrades), super.onHandshake(t);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(t) {
    const n = [];
    for (let s = 0; s < t.length; s++)
      ~this.transports.indexOf(t[s]) && n.push(t[s]);
    return n;
  }
}
let ig = class extends sg {
  constructor(t, n = {}) {
    const s = typeof t == "object" ? t : n;
    (!s.transports || s.transports && typeof s.transports[0] == "string") && (s.transports = (s.transports || ["polling", "websocket", "webtransport"]).map((i) => Jp[i]).filter((i) => !!i)), super(t, s);
  }
};
function rg(e, t = "", n) {
  let s = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), s = Jr(e)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/";
  const r = s.host.indexOf(":") !== -1 ? "[" + s.host + "]" : s.host;
  return s.id = s.protocol + "://" + r + ":" + s.port + t, s.href = s.protocol + "://" + r + (n && n.port === s.port ? "" : ":" + s.port), s;
}
const og = typeof ArrayBuffer == "function", ag = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, Hc = Object.prototype.toString, lg = typeof Blob == "function" || typeof Blob < "u" && Hc.call(Blob) === "[object BlobConstructor]", cg = typeof File == "function" || typeof File < "u" && Hc.call(File) === "[object FileConstructor]";
function No(e) {
  return og && (e instanceof ArrayBuffer || ag(e)) || lg && e instanceof Blob || cg && e instanceof File;
}
function Ei(e, t) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let n = 0, s = e.length; n < s; n++)
      if (Ei(e[n]))
        return !0;
    return !1;
  }
  if (No(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return Ei(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && Ei(e[n]))
      return !0;
  return !1;
}
function ug(e) {
  const t = [], n = e.data, s = e;
  return s.data = eo(n, t), s.attachments = t.length, { packet: s, buffers: t };
}
function eo(e, t) {
  if (!e)
    return e;
  if (No(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let s = 0; s < e.length; s++)
      n[s] = eo(e[s], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const s in e)
      Object.prototype.hasOwnProperty.call(e, s) && (n[s] = eo(e[s], t));
    return n;
  }
  return e;
}
function fg(e, t) {
  return e.data = to(e.data, t), delete e.attachments, e;
}
function to(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = to(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = to(e[n], t));
  return e;
}
const hg = [
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "newListener",
  "removeListener"
  // used by the Node.js EventEmitter
];
var Oe;
(function(e) {
  e[e.CONNECT = 0] = "CONNECT", e[e.DISCONNECT = 1] = "DISCONNECT", e[e.EVENT = 2] = "EVENT", e[e.ACK = 3] = "ACK", e[e.CONNECT_ERROR = 4] = "CONNECT_ERROR", e[e.BINARY_EVENT = 5] = "BINARY_EVENT", e[e.BINARY_ACK = 6] = "BINARY_ACK";
})(Oe || (Oe = {}));
class dg {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(t) {
    this.replacer = t;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(t) {
    return (t.type === Oe.EVENT || t.type === Oe.ACK) && Ei(t) ? this.encodeAsBinary({
      type: t.type === Oe.EVENT ? Oe.BINARY_EVENT : Oe.BINARY_ACK,
      nsp: t.nsp,
      data: t.data,
      id: t.id
    }) : [this.encodeAsString(t)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(t) {
    let n = "" + t.type;
    return (t.type === Oe.BINARY_EVENT || t.type === Oe.BINARY_ACK) && (n += t.attachments + "-"), t.nsp && t.nsp !== "/" && (n += t.nsp + ","), t.id != null && (n += t.id), t.data != null && (n += JSON.stringify(t.data, this.replacer)), n;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(t) {
    const n = ug(t), s = this.encodeAsString(n.packet), i = n.buffers;
    return i.unshift(s), i;
  }
}
function nl(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
class Po extends ut {
  /**
   * Decoder constructor
   *
   * @param {function} reviver - custom reviver to pass down to JSON.stringify
   */
  constructor(t) {
    super(), this.reviver = t;
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(t) {
    let n;
    if (typeof t == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      n = this.decodeString(t);
      const s = n.type === Oe.BINARY_EVENT;
      s || n.type === Oe.BINARY_ACK ? (n.type = s ? Oe.EVENT : Oe.ACK, this.reconstructor = new pg(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (No(t) || t.base64)
      if (this.reconstructor)
        n = this.reconstructor.takeBinaryData(t), n && (this.reconstructor = null, super.emitReserved("decoded", n));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + t);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(t) {
    let n = 0;
    const s = {
      type: Number(t.charAt(0))
    };
    if (Oe[s.type] === void 0)
      throw new Error("unknown packet type " + s.type);
    if (s.type === Oe.BINARY_EVENT || s.type === Oe.BINARY_ACK) {
      const r = n + 1;
      for (; t.charAt(++n) !== "-" && n != t.length; )
        ;
      const o = t.substring(r, n);
      if (o != Number(o) || t.charAt(n) !== "-")
        throw new Error("Illegal attachments");
      s.attachments = Number(o);
    }
    if (t.charAt(n + 1) === "/") {
      const r = n + 1;
      for (; ++n && !(t.charAt(n) === "," || n === t.length); )
        ;
      s.nsp = t.substring(r, n);
    } else
      s.nsp = "/";
    const i = t.charAt(n + 1);
    if (i !== "" && Number(i) == i) {
      const r = n + 1;
      for (; ++n; ) {
        const o = t.charAt(n);
        if (o == null || Number(o) != o) {
          --n;
          break;
        }
        if (n === t.length)
          break;
      }
      s.id = Number(t.substring(r, n + 1));
    }
    if (t.charAt(++n)) {
      const r = this.tryParse(t.substr(n));
      if (Po.isPayloadValid(s.type, r))
        s.data = r;
      else
        throw new Error("invalid payload");
    }
    return s;
  }
  tryParse(t) {
    try {
      return JSON.parse(t, this.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(t, n) {
    switch (t) {
      case Oe.CONNECT:
        return nl(n);
      case Oe.DISCONNECT:
        return n === void 0;
      case Oe.CONNECT_ERROR:
        return typeof n == "string" || nl(n);
      case Oe.EVENT:
      case Oe.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && hg.indexOf(n[0]) === -1);
      case Oe.ACK:
      case Oe.BINARY_ACK:
        return Array.isArray(n);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
}
class pg {
  constructor(t) {
    this.packet = t, this.buffers = [], this.reconPack = t;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(t) {
    if (this.buffers.push(t), this.buffers.length === this.reconPack.attachments) {
      const n = fg(this.reconPack, this.buffers);
      return this.finishedReconstruction(), n;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
const gg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: Po,
  Encoder: dg,
  get PacketType() {
    return Oe;
  }
}, Symbol.toStringTag, { value: "Module" }));
function Jt(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const mg = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class qc extends ut {
  /**
   * `Socket` constructor.
   */
  constructor(t, n, s) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = t, this.nsp = n, s && s.auth && (this.auth = s.auth), this._opts = Object.assign({}, s), this.io._autoConnect && this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const t = this.io;
    this.subs = [
      Jt(t, "open", this.onopen.bind(this)),
      Jt(t, "packet", this.onpacket.bind(this)),
      Jt(t, "error", this.onerror.bind(this)),
      Jt(t, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...t) {
    return t.unshift("message"), this.emit.apply(this, t), this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(t, ...n) {
    var s, i, r;
    if (mg.hasOwnProperty(t))
      throw new Error('"' + t.toString() + '" is a reserved event name');
    if (n.unshift(t), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(n), this;
    const o = {
      type: Oe.EVENT,
      data: n
    };
    if (o.options = {}, o.options.compress = this.flags.compress !== !1, typeof n[n.length - 1] == "function") {
      const c = this.ids++, w = n.pop();
      this._registerAckCallback(c, w), o.id = c;
    }
    const a = (i = (s = this.io.engine) === null || s === void 0 ? void 0 : s.transport) === null || i === void 0 ? void 0 : i.writable, l = this.connected && !(!((r = this.io.engine) === null || r === void 0) && r._hasPingExpired());
    return this.flags.volatile && !a || (l ? (this.notifyOutgoingListeners(o), this.packet(o)) : this.sendBuffer.push(o)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(t, n) {
    var s;
    const i = (s = this.flags.timeout) !== null && s !== void 0 ? s : this._opts.ackTimeout;
    if (i === void 0) {
      this.acks[t] = n;
      return;
    }
    const r = this.io.setTimeoutFn(() => {
      delete this.acks[t];
      for (let a = 0; a < this.sendBuffer.length; a++)
        this.sendBuffer[a].id === t && this.sendBuffer.splice(a, 1);
      n.call(this, new Error("operation has timed out"));
    }, i), o = (...a) => {
      this.io.clearTimeoutFn(r), n.apply(this, a);
    };
    o.withError = !0, this.acks[t] = o;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(t, ...n) {
    return new Promise((s, i) => {
      const r = (o, a) => o ? i(o) : s(a);
      r.withError = !0, n.push(r), this.emit(t, ...n);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(t) {
    let n;
    typeof t[t.length - 1] == "function" && (n = t.pop());
    const s = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: t,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    t.push((i, ...r) => s !== this._queue[0] ? void 0 : (i !== null ? s.tryCount > this._opts.retries && (this._queue.shift(), n && n(i)) : (this._queue.shift(), n && n(null, ...r)), s.pending = !1, this._drainQueue())), this._queue.push(s), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(t = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const n = this._queue[0];
    n.pending && !t || (n.pending = !0, n.tryCount++, this.flags = n.flags, this.emit.apply(this, n.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(t) {
    t.nsp = this.nsp, this.io._packet(t);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((t) => {
      this._sendConnectPacket(t);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(t) {
    this.packet({
      type: Oe.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, t) : t
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(t) {
    this.connected || this.emitReserved("connect_error", t);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(t, n) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", t, n), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((t) => {
      if (!this.sendBuffer.some((s) => String(s.id) === t)) {
        const s = this.acks[t];
        delete this.acks[t], s.withError && s.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(t) {
    if (t.nsp === this.nsp)
      switch (t.type) {
        case Oe.CONNECT:
          t.data && t.data.sid ? this.onconnect(t.data.sid, t.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case Oe.EVENT:
        case Oe.BINARY_EVENT:
          this.onevent(t);
          break;
        case Oe.ACK:
        case Oe.BINARY_ACK:
          this.onack(t);
          break;
        case Oe.DISCONNECT:
          this.ondisconnect();
          break;
        case Oe.CONNECT_ERROR:
          this.destroy();
          const s = new Error(t.data.message);
          s.data = t.data.data, this.emitReserved("connect_error", s);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(t) {
    const n = t.data || [];
    t.id != null && n.push(this.ack(t.id)), this.connected ? this.emitEvent(n) : this.receiveBuffer.push(Object.freeze(n));
  }
  emitEvent(t) {
    if (this._anyListeners && this._anyListeners.length) {
      const n = this._anyListeners.slice();
      for (const s of n)
        s.apply(this, t);
    }
    super.emit.apply(this, t), this._pid && t.length && typeof t[t.length - 1] == "string" && (this._lastOffset = t[t.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(t) {
    const n = this;
    let s = !1;
    return function(...i) {
      s || (s = !0, n.packet({
        type: Oe.ACK,
        id: t,
        data: i
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(t) {
    const n = this.acks[t.id];
    typeof n == "function" && (delete this.acks[t.id], n.withError && t.data.unshift(null), n.apply(this, t.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(t, n) {
    this.id = t, this.recovered = n && this._pid === n, this._pid = n, this.connected = !0, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(!0);
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((t) => this.emitEvent(t)), this.receiveBuffer = [], this.sendBuffer.forEach((t) => {
      this.notifyOutgoingListeners(t), this.packet(t);
    }), this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    this.subs && (this.subs.forEach((t) => t()), this.subs = void 0), this.io._destroy(this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    return this.connected && this.packet({ type: Oe.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(t) {
    return this.flags.compress = t, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(t) {
    return this.flags.timeout = t, this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(t) {
    if (!this._anyListeners)
      return this;
    if (t) {
      const n = this._anyListeners;
      for (let s = 0; s < n.length; s++)
        if (t === n[s])
          return n.splice(s, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(t), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(t), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(t) {
    if (!this._anyOutgoingListeners)
      return this;
    if (t) {
      const n = this._anyOutgoingListeners;
      for (let s = 0; s < n.length; s++)
        if (t === n[s])
          return n.splice(s, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(t) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const n = this._anyOutgoingListeners.slice();
      for (const s of n)
        s.apply(this, t.data);
    }
  }
}
function us(e) {
  e = e || {}, this.ms = e.min || 100, this.max = e.max || 1e4, this.factor = e.factor || 2, this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0, this.attempts = 0;
}
us.prototype.duration = function() {
  var e = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var t = Math.random(), n = Math.floor(t * this.jitter * e);
    e = (Math.floor(t * 10) & 1) == 0 ? e - n : e + n;
  }
  return Math.min(e, this.max) | 0;
};
us.prototype.reset = function() {
  this.attempts = 0;
};
us.prototype.setMin = function(e) {
  this.ms = e;
};
us.prototype.setMax = function(e) {
  this.max = e;
};
us.prototype.setJitter = function(e) {
  this.jitter = e;
};
class no extends ut {
  constructor(t, n) {
    var s;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, nr(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((s = n.randomizationFactor) !== null && s !== void 0 ? s : 0.5), this.backoff = new us({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const i = n.parser || gg;
    this.encoder = new i.Encoder(), this.decoder = new i.Decoder(), this._autoConnect = n.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(t) {
    return arguments.length ? (this._reconnection = !!t, t || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(t) {
    return t === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = t, this);
  }
  reconnectionDelay(t) {
    var n;
    return t === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = t, (n = this.backoff) === null || n === void 0 || n.setMin(t), this);
  }
  randomizationFactor(t) {
    var n;
    return t === void 0 ? this._randomizationFactor : (this._randomizationFactor = t, (n = this.backoff) === null || n === void 0 || n.setJitter(t), this);
  }
  reconnectionDelayMax(t) {
    var n;
    return t === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t, (n = this.backoff) === null || n === void 0 || n.setMax(t), this);
  }
  timeout(t) {
    return arguments.length ? (this._timeout = t, this) : this._timeout;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(t) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new ig(this.uri, this.opts);
    const n = this.engine, s = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const i = Jt(n, "open", function() {
      s.onopen(), t && t();
    }), r = (a) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", a), t ? t(a) : this.maybeReconnectOnOpen();
    }, o = Jt(n, "error", r);
    if (this._timeout !== !1) {
      const a = this._timeout, l = this.setTimeoutFn(() => {
        i(), r(new Error("timeout")), n.close();
      }, a);
      this.opts.autoUnref && l.unref(), this.subs.push(() => {
        this.clearTimeoutFn(l);
      });
    }
    return this.subs.push(i), this.subs.push(o), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(t) {
    return this.open(t);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const t = this.engine;
    this.subs.push(
      Jt(t, "ping", this.onping.bind(this)),
      Jt(t, "data", this.ondata.bind(this)),
      Jt(t, "error", this.onerror.bind(this)),
      Jt(t, "close", this.onclose.bind(this)),
      // @ts-ignore
      Jt(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(t) {
    try {
      this.decoder.add(t);
    } catch (n) {
      this.onclose("parse error", n);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(t) {
    tr(() => {
      this.emitReserved("packet", t);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(t) {
    this.emitReserved("error", t);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(t, n) {
    let s = this.nsps[t];
    return s ? this._autoConnect && !s.active && s.connect() : (s = new qc(this, t, n), this.nsps[t] = s), s;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(t) {
    const n = Object.keys(this.nsps);
    for (const s of n)
      if (this.nsps[s].active)
        return;
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(t) {
    const n = this.encoder.encode(t);
    for (let s = 0; s < n.length; s++)
      this.engine.write(n[s], t.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((t) => t()), this.subs.length = 0, this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(t, n) {
    var s;
    this.cleanup(), (s = this.engine) === null || s === void 0 || s.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", t, n), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const t = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const n = this.backoff.duration();
      this._reconnecting = !0;
      const s = this.setTimeoutFn(() => {
        t.skipReconnect || (this.emitReserved("reconnect_attempt", t.backoff.attempts), !t.skipReconnect && t.open((i) => {
          i ? (t._reconnecting = !1, t.reconnect(), this.emitReserved("reconnect_error", i)) : t.onreconnect();
        }));
      }, n);
      this.opts.autoUnref && s.unref(), this.subs.push(() => {
        this.clearTimeoutFn(s);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const t = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", t);
  }
}
const Rs = {};
function Ci(e, t) {
  typeof e == "object" && (t = e, e = void 0), t = t || {};
  const n = rg(e, t.path || "/socket.io"), s = n.source, i = n.id, r = n.path, o = Rs[i] && r in Rs[i].nsps, a = t.forceNew || t["force new connection"] || t.multiplex === !1 || o;
  let l;
  return a ? l = new no(s, t) : (Rs[i] || (Rs[i] = new no(s, t)), l = Rs[i]), n.query && !t.query && (t.query = n.queryKey), l.socket(n.path, t);
}
Object.assign(Ci, {
  Manager: no,
  Socket: qc,
  io: Ci,
  connect: Ci
});
function _g() {
  const e = ie([]), t = ie(!1), n = ie(""), s = ie(!1), i = ie(!1), r = ie(!1), o = ie("connecting"), a = ie(0), l = 5, h = ie({}), c = ie(null), w = ie("");
  let m = null, P = null, M = null, K = null, Pe, fe;
  const ge = (q) => {
    Pe = q, q && localStorage.setItem("ctid", q);
  }, ve = (q) => {
    fe = q;
  }, T = (q) => {
    var Le;
    const Ne = Pe || localStorage.getItem("ctid"), le = {};
    Ne && (le.conversation_token = Ne), fe && (le.widget_id = fe);
    try {
      le.page_url = window.parent !== window && ((Le = window.parent.location) != null && Le.href) ? window.parent.location.href : document.referrer || window.location.href;
    } catch {
      le.page_url = document.referrer || "";
    }
    return m = Ci(`${Ks.WS_URL}/widget`, {
      transports: ["websocket"],
      reconnection: !0,
      reconnectionAttempts: l,
      reconnectionDelay: 1e3,
      auth: Object.keys(le).length > 0 ? le : void 0
    }), m.on("connect", () => {
      o.value = "connected", a.value = 0;
    }), m.on("disconnect", () => {
      o.value === "connected" && (console.log("Socket disconnected, setting connection status to connecting"), o.value = "connecting");
    }), m.on("connect_error", () => {
      a.value++, console.error("Socket connection failed, attempt:", a.value, "connection status:", o.value), a.value >= l && (o.value = "failed");
    }), m.on("chat_response", (V) => {
      if (t.value = !1, V.session_id ? (console.log("Captured session_id from chat_response:", V.session_id), w.value = V.session_id) : console.warn("No session_id in chat_response data:", V), V.type === "agent_message") {
        const pt = {
          message: V.message,
          message_type: "agent",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          session_id: "",
          agent_name: V.agent_name,
          stream: !0,
          // live reply → client-side typewriter reveal
          attributes: {
            end_chat: V.end_chat,
            end_chat_reason: V.end_chat_reason,
            end_chat_description: V.end_chat_description,
            request_rating: V.request_rating
          }
        };
        V.attachments && Array.isArray(V.attachments) && (pt.id = V.message_id, pt.attachments = V.attachments.map((p, y) => ({
          id: V.message_id * 1e3 + y,
          filename: p.filename,
          file_url: p.file_url,
          content_type: p.content_type,
          file_size: p.file_size
        }))), e.value.push(pt);
      } else V.shopify_output && typeof V.shopify_output == "object" && V.shopify_output.products ? e.value.push({
        message: V.message,
        // Keep the accompanying text message
        message_type: "product",
        // Use 'product' type for rendering
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: V.agent_name,
        // Assign the whole structured object
        shopify_output: V.shopify_output,
        // Remove the old flattened fields (product_id, product_title, etc.)
        attributes: {
          // Keep other attributes if needed
          end_chat: V.end_chat,
          request_rating: V.request_rating
        }
      }) : e.value.push({
        message: V.message,
        message_type: "bot",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: V.agent_name,
        stream: !0,
        // live reply → client-side typewriter reveal
        // Knowledge-base citations (display gated by show_citations in the widget)
        sources: Array.isArray(V.sources) && V.sources.length ? V.sources : void 0,
        attributes: {
          end_chat: V.end_chat,
          end_chat_reason: V.end_chat_reason,
          end_chat_description: V.end_chat_description,
          request_rating: V.request_rating
        }
      });
    }), m.on("handle_taken_over", (V) => {
      e.value.push({
        message: `${V.user_name} joined the conversation`,
        message_type: "system",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: V.session_id
      }), h.value = {
        ...h.value,
        human_agent_name: V.user_name,
        human_agent_profile_pic: V.profile_picture
      }, P && P(V);
    }), m.on("session_initialized", (V) => {
      V.session_id && (console.log("Initialized session_id from session_initialized:", V.session_id), w.value = V.session_id);
    }), m.on("error", Ze), m.on("chat_history", Re), m.on("rating_submitted", ye), m.on("display_form", Qe), m.on("form_submitted", it), m.on("workflow_state", lt), m.on("workflow_proceeded", ue), m;
  }, I = async () => {
    try {
      return o.value = "connecting", a.value = 0, m && (m.removeAllListeners(), m.disconnect(), m = null), m = T(""), new Promise((q) => {
        m == null || m.on("connect", () => {
          q(!0);
        }), m == null || m.on("connect_error", () => {
          a.value >= l && q(!1);
        });
      });
    } catch (q) {
      return console.error("Socket initialization failed:", q), o.value = "failed", !1;
    }
  }, j = () => (m && m.disconnect(), I()), G = (q) => {
    P = q;
  }, Ae = (q) => {
    M = q;
  }, ze = (q) => {
    K = q;
  }, Ze = (q) => {
    t.value = !1, n.value = qh(q), s.value = !0, setTimeout(() => {
      s.value = !1, n.value = "";
    }, 5e3);
  }, Re = (q) => {
    if (q.type === "chat_history" && Array.isArray(q.messages)) {
      const Ne = q.messages.map((le) => {
        var V, pt;
        const Le = {
          message: le.message,
          message_type: le.message_type,
          created_at: le.created_at,
          session_id: "",
          agent_name: le.agent_name || "",
          user_name: le.user_name || "",
          attributes: le.attributes || {},
          attachments: le.attachments || []
          // Include attachments
        };
        return Array.isArray((V = le.attributes) == null ? void 0 : V.sources) && le.attributes.sources.length && (Le.sources = le.attributes.sources), (pt = le.attributes) != null && pt.shopify_output && typeof le.attributes.shopify_output == "object" ? {
          ...Le,
          message_type: "product",
          shopify_output: le.attributes.shopify_output
        } : Le;
      });
      e.value = [
        ...Ne.filter(
          (le) => !e.value.some(
            (Le) => Le.message === le.message && Le.created_at === le.created_at
          )
        ),
        ...e.value
      ];
    }
  }, ye = (q) => {
    q.success && e.value.push({
      message: "Thank you for your feedback!",
      message_type: "system",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    });
  }, Qe = (q) => {
    var Ne;
    console.log("Form display handler in composable:", q), t.value = !1, c.value = q.form_data, console.log("Set currentForm in handleDisplayForm:", c.value), ((Ne = q.form_data) == null ? void 0 : Ne.form_full_screen) === !0 ? (console.log("Full screen form detected, triggering workflow state callback"), M && M({
      type: "form",
      form_data: q.form_data,
      session_id: q.session_id
    })) : e.value.push({
      message: "",
      message_type: "form",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: q.session_id,
      attributes: {
        form_data: q.form_data
      }
    });
  }, it = (q) => {
    console.log("Form submitted confirmation received, clearing currentForm"), c.value = null, q.success && console.log("Form submitted successfully");
  }, lt = (q) => {
    console.log("Workflow state received in composable:", q), (q.type === "form" || q.type === "display_form") && (console.log("Setting currentForm from workflow state:", q.form_data), c.value = q.form_data), M && M(q);
  }, ue = (q) => {
    console.log("Workflow proceeded in composable:", q), K && K(q);
  }, de = async (q, Ne) => {
    !m || !q || m.emit("submit_rating", {
      rating: q,
      feedback: Ne
    });
  }, ae = async (q) => {
    var Le;
    if (console.log("Submitting form in socket:", q), console.log("Current form in socket:", c.value), console.log("Socket in socket:", m), !m) {
      console.error("No socket available for form submission");
      return;
    }
    if (!q || Object.keys(q).length === 0) {
      console.error("No form data to submit");
      return;
    }
    const le = ((Le = c.value) == null ? void 0 : Le.form_type) === "contact" ? "submit_contact_info" : "submit_form";
    console.log(`Emitting ${le} event with data:`, q), m.emit(le, {
      form_data: q
    }), c.value = null;
  }, Se = async () => {
    m && (console.log("Getting workflow state 12"), m.emit("get_workflow_state"));
  }, rt = async () => {
    m && m.emit("proceed_workflow", {});
  }, oe = async (q, Ne, le = []) => {
    if (!m || !q.trim() && le.length === 0) return;
    h.value.human_agent_name || (t.value = !0);
    const Le = {
      message: q,
      message_type: "user",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    };
    le.length > 0 && (Le.attachments = le.map((V, pt) => {
      let p = "";
      if (V.content_type.startsWith("image/")) {
        const y = atob(V.content), x = new Array(y.length);
        for (let R = 0; R < y.length; R++)
          x[R] = y.charCodeAt(R);
        const F = new Uint8Array(x), L = new Blob([F], { type: V.content_type });
        p = URL.createObjectURL(L);
      }
      return {
        id: Date.now() * 1e3 + pt,
        // Temporary ID
        filename: V.filename,
        file_url: p,
        // Temporary blob URL, will be replaced
        content_type: V.content_type,
        file_size: V.size,
        _isTemporary: !0
        // Flag to identify temporary attachments
      };
    })), e.value.push(Le), m.emit("chat", {
      message: q,
      email: Ne,
      files: le
      // Send files with base64 content
    }), r.value = !0;
  }, Me = () => {
    e.value = [], r.value = !1, w.value = "", t.value = !1, c.value = null;
  };
  return {
    messages: e,
    loading: t,
    errorMessage: n,
    showError: s,
    loadingHistory: i,
    hasStartedChat: r,
    connectionStatus: o,
    sendMessage: oe,
    endChat: (q = "CUSTOMER_REQUEST") => new Promise((Ne) => {
      if (!m || !m.connected) {
        Me(), Ne();
        return;
      }
      let le = !1;
      const Le = () => {
        le || (le = !0, clearTimeout(V), m == null || m.off("chat_ended", Le), Me(), Ne());
      }, V = setTimeout(Le, 3e3);
      m.on("chat_ended", Le), m.emit("end_chat", { reason: q });
    }),
    loadChatHistory: async () => {
      if (m)
        try {
          i.value = !0, m.emit("get_chat_history");
        } catch (q) {
          console.error("Failed to load chat history:", q);
        } finally {
          i.value = !1;
        }
    },
    connect: I,
    reconnect: j,
    cleanup: () => {
      m && (m.removeAllListeners(), m.disconnect(), m = null), P = null, M = null, K = null;
    },
    humanAgent: h,
    onTakeover: G,
    submitRating: de,
    currentForm: c,
    submitForm: ae,
    getWorkflowState: Se,
    proceedWorkflow: rt,
    onWorkflowState: Ae,
    onWorkflowProceeded: ze,
    currentSessionId: w,
    setToken: ge,
    setWidgetId: ve
  };
}
function yg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Or = { exports: {} }, sl;
function vg() {
  return sl || (sl = 1, function(e) {
    (function() {
      function t(f, v, C) {
        return f.call.apply(f.bind, arguments);
      }
      function n(f, v, C) {
        if (!f) throw Error();
        if (2 < arguments.length) {
          var S = Array.prototype.slice.call(arguments, 2);
          return function() {
            var B = Array.prototype.slice.call(arguments);
            return Array.prototype.unshift.apply(B, S), f.apply(v, B);
          };
        }
        return function() {
          return f.apply(v, arguments);
        };
      }
      function s(f, v, C) {
        return s = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? t : n, s.apply(null, arguments);
      }
      var i = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      function r(f, v) {
        this.a = f, this.o = v || f, this.c = this.o.document;
      }
      var o = !!window.FontFace;
      function a(f, v, C, S) {
        if (v = f.c.createElement(v), C) for (var B in C) C.hasOwnProperty(B) && (B == "style" ? v.style.cssText = C[B] : v.setAttribute(B, C[B]));
        return S && v.appendChild(f.c.createTextNode(S)), v;
      }
      function l(f, v, C) {
        f = f.c.getElementsByTagName(v)[0], f || (f = document.documentElement), f.insertBefore(C, f.lastChild);
      }
      function h(f) {
        f.parentNode && f.parentNode.removeChild(f);
      }
      function c(f, v, C) {
        v = v || [], C = C || [];
        for (var S = f.className.split(/\s+/), B = 0; B < v.length; B += 1) {
          for (var Y = !1, ne = 0; ne < S.length; ne += 1) if (v[B] === S[ne]) {
            Y = !0;
            break;
          }
          Y || S.push(v[B]);
        }
        for (v = [], B = 0; B < S.length; B += 1) {
          for (Y = !1, ne = 0; ne < C.length; ne += 1) if (S[B] === C[ne]) {
            Y = !0;
            break;
          }
          Y || v.push(S[B]);
        }
        f.className = v.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
      }
      function w(f, v) {
        for (var C = f.className.split(/\s+/), S = 0, B = C.length; S < B; S++) if (C[S] == v) return !0;
        return !1;
      }
      function m(f) {
        return f.o.location.hostname || f.a.location.hostname;
      }
      function P(f, v, C) {
        function S() {
          we && B && Y && (we(ne), we = null);
        }
        v = a(f, "link", { rel: "stylesheet", href: v, media: "all" });
        var B = !1, Y = !0, ne = null, we = C || null;
        o ? (v.onload = function() {
          B = !0, S();
        }, v.onerror = function() {
          B = !0, ne = Error("Stylesheet failed to load"), S();
        }) : setTimeout(function() {
          B = !0, S();
        }, 0), l(f, "head", v);
      }
      function M(f, v, C, S) {
        var B = f.c.getElementsByTagName("head")[0];
        if (B) {
          var Y = a(f, "script", { src: v }), ne = !1;
          return Y.onload = Y.onreadystatechange = function() {
            ne || this.readyState && this.readyState != "loaded" && this.readyState != "complete" || (ne = !0, C && C(null), Y.onload = Y.onreadystatechange = null, Y.parentNode.tagName == "HEAD" && B.removeChild(Y));
          }, B.appendChild(Y), setTimeout(function() {
            ne || (ne = !0, C && C(Error("Script load timeout")));
          }, S || 5e3), Y;
        }
        return null;
      }
      function K() {
        this.a = 0, this.c = null;
      }
      function Pe(f) {
        return f.a++, function() {
          f.a--, ge(f);
        };
      }
      function fe(f, v) {
        f.c = v, ge(f);
      }
      function ge(f) {
        f.a == 0 && f.c && (f.c(), f.c = null);
      }
      function ve(f) {
        this.a = f || "-";
      }
      ve.prototype.c = function(f) {
        for (var v = [], C = 0; C < arguments.length; C++) v.push(arguments[C].replace(/[\W_]+/g, "").toLowerCase());
        return v.join(this.a);
      };
      function T(f, v) {
        this.c = f, this.f = 4, this.a = "n";
        var C = (v || "n4").match(/^([nio])([1-9])$/i);
        C && (this.a = C[1], this.f = parseInt(C[2], 10));
      }
      function I(f) {
        return Ae(f) + " " + (f.f + "00") + " 300px " + j(f.c);
      }
      function j(f) {
        var v = [];
        f = f.split(/,\s*/);
        for (var C = 0; C < f.length; C++) {
          var S = f[C].replace(/['"]/g, "");
          S.indexOf(" ") != -1 || /^\d/.test(S) ? v.push("'" + S + "'") : v.push(S);
        }
        return v.join(",");
      }
      function G(f) {
        return f.a + f.f;
      }
      function Ae(f) {
        var v = "normal";
        return f.a === "o" ? v = "oblique" : f.a === "i" && (v = "italic"), v;
      }
      function ze(f) {
        var v = 4, C = "n", S = null;
        return f && ((S = f.match(/(normal|oblique|italic)/i)) && S[1] && (C = S[1].substr(0, 1).toLowerCase()), (S = f.match(/([1-9]00|normal|bold)/i)) && S[1] && (/bold/i.test(S[1]) ? v = 7 : /[1-9]00/.test(S[1]) && (v = parseInt(S[1].substr(0, 1), 10)))), C + v;
      }
      function Ze(f, v) {
        this.c = f, this.f = f.o.document.documentElement, this.h = v, this.a = new ve("-"), this.j = v.events !== !1, this.g = v.classes !== !1;
      }
      function Re(f) {
        f.g && c(f.f, [f.a.c("wf", "loading")]), Qe(f, "loading");
      }
      function ye(f) {
        if (f.g) {
          var v = w(f.f, f.a.c("wf", "active")), C = [], S = [f.a.c("wf", "loading")];
          v || C.push(f.a.c("wf", "inactive")), c(f.f, C, S);
        }
        Qe(f, "inactive");
      }
      function Qe(f, v, C) {
        f.j && f.h[v] && (C ? f.h[v](C.c, G(C)) : f.h[v]());
      }
      function it() {
        this.c = {};
      }
      function lt(f, v, C) {
        var S = [], B;
        for (B in v) if (v.hasOwnProperty(B)) {
          var Y = f.c[B];
          Y && S.push(Y(v[B], C));
        }
        return S;
      }
      function ue(f, v) {
        this.c = f, this.f = v, this.a = a(this.c, "span", { "aria-hidden": "true" }, this.f);
      }
      function de(f) {
        l(f.c, "body", f.a);
      }
      function ae(f) {
        return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + j(f.c) + ";" + ("font-style:" + Ae(f) + ";font-weight:" + (f.f + "00") + ";");
      }
      function Se(f, v, C, S, B, Y) {
        this.g = f, this.j = v, this.a = S, this.c = C, this.f = B || 3e3, this.h = Y || void 0;
      }
      Se.prototype.start = function() {
        var f = this.c.o.document, v = this, C = i(), S = new Promise(function(ne, we) {
          function Ee() {
            i() - C >= v.f ? we() : f.fonts.load(I(v.a), v.h).then(function(et) {
              1 <= et.length ? ne() : setTimeout(Ee, 25);
            }, function() {
              we();
            });
          }
          Ee();
        }), B = null, Y = new Promise(function(ne, we) {
          B = setTimeout(we, v.f);
        });
        Promise.race([Y, S]).then(function() {
          B && (clearTimeout(B), B = null), v.g(v.a);
        }, function() {
          v.j(v.a);
        });
      };
      function rt(f, v, C, S, B, Y, ne) {
        this.v = f, this.B = v, this.c = C, this.a = S, this.s = ne || "BESbswy", this.f = {}, this.w = B || 3e3, this.u = Y || null, this.m = this.j = this.h = this.g = null, this.g = new ue(this.c, this.s), this.h = new ue(this.c, this.s), this.j = new ue(this.c, this.s), this.m = new ue(this.c, this.s), f = new T(this.a.c + ",serif", G(this.a)), f = ae(f), this.g.a.style.cssText = f, f = new T(this.a.c + ",sans-serif", G(this.a)), f = ae(f), this.h.a.style.cssText = f, f = new T("serif", G(this.a)), f = ae(f), this.j.a.style.cssText = f, f = new T("sans-serif", G(this.a)), f = ae(f), this.m.a.style.cssText = f, de(this.g), de(this.h), de(this.j), de(this.m);
      }
      var oe = { D: "serif", C: "sans-serif" }, Me = null;
      function De() {
        if (Me === null) {
          var f = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);
          Me = !!f && (536 > parseInt(f[1], 10) || parseInt(f[1], 10) === 536 && 11 >= parseInt(f[2], 10));
        }
        return Me;
      }
      rt.prototype.start = function() {
        this.f.serif = this.j.a.offsetWidth, this.f["sans-serif"] = this.m.a.offsetWidth, this.A = i(), Ie(this);
      };
      function yt(f, v, C) {
        for (var S in oe) if (oe.hasOwnProperty(S) && v === f.f[oe[S]] && C === f.f[oe[S]]) return !0;
        return !1;
      }
      function Ie(f) {
        var v = f.g.a.offsetWidth, C = f.h.a.offsetWidth, S;
        (S = v === f.f.serif && C === f.f["sans-serif"]) || (S = De() && yt(f, v, C)), S ? i() - f.A >= f.w ? De() && yt(f, v, C) && (f.u === null || f.u.hasOwnProperty(f.a.c)) ? Ne(f, f.v) : Ne(f, f.B) : q(f) : Ne(f, f.v);
      }
      function q(f) {
        setTimeout(s(function() {
          Ie(this);
        }, f), 50);
      }
      function Ne(f, v) {
        setTimeout(s(function() {
          h(this.g.a), h(this.h.a), h(this.j.a), h(this.m.a), v(this.a);
        }, f), 0);
      }
      function le(f, v, C) {
        this.c = f, this.a = v, this.f = 0, this.m = this.j = !1, this.s = C;
      }
      var Le = null;
      le.prototype.g = function(f) {
        var v = this.a;
        v.g && c(v.f, [v.a.c("wf", f.c, G(f).toString(), "active")], [v.a.c("wf", f.c, G(f).toString(), "loading"), v.a.c("wf", f.c, G(f).toString(), "inactive")]), Qe(v, "fontactive", f), this.m = !0, V(this);
      }, le.prototype.h = function(f) {
        var v = this.a;
        if (v.g) {
          var C = w(v.f, v.a.c("wf", f.c, G(f).toString(), "active")), S = [], B = [v.a.c("wf", f.c, G(f).toString(), "loading")];
          C || S.push(v.a.c("wf", f.c, G(f).toString(), "inactive")), c(v.f, S, B);
        }
        Qe(v, "fontinactive", f), V(this);
      };
      function V(f) {
        --f.f == 0 && f.j && (f.m ? (f = f.a, f.g && c(f.f, [f.a.c("wf", "active")], [f.a.c("wf", "loading"), f.a.c("wf", "inactive")]), Qe(f, "active")) : ye(f.a));
      }
      function pt(f) {
        this.j = f, this.a = new it(), this.h = 0, this.f = this.g = !0;
      }
      pt.prototype.load = function(f) {
        this.c = new r(this.j, f.context || this.j), this.g = f.events !== !1, this.f = f.classes !== !1, y(this, new Ze(this.c, f), f);
      };
      function p(f, v, C, S, B) {
        var Y = --f.h == 0;
        (f.f || f.g) && setTimeout(function() {
          var ne = B || null, we = S || null || {};
          if (C.length === 0 && Y) ye(v.a);
          else {
            v.f += C.length, Y && (v.j = Y);
            var Ee, et = [];
            for (Ee = 0; Ee < C.length; Ee++) {
              var Be = C[Ee], ct = we[Be.c], kt = v.a, Xe = Be;
              if (kt.g && c(kt.f, [kt.a.c("wf", Xe.c, G(Xe).toString(), "loading")]), Qe(kt, "fontloading", Xe), kt = null, Le === null) if (window.FontFace) {
                var Xe = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent), Pt = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
                Le = Xe ? 42 < parseInt(Xe[1], 10) : !Pt;
              } else Le = !1;
              Le ? kt = new Se(s(v.g, v), s(v.h, v), v.c, Be, v.s, ct) : kt = new rt(s(v.g, v), s(v.h, v), v.c, Be, v.s, ne, ct), et.push(kt);
            }
            for (Ee = 0; Ee < et.length; Ee++) et[Ee].start();
          }
        }, 0);
      }
      function y(f, v, C) {
        var B = [], S = C.timeout;
        Re(v);
        var B = lt(f.a, C, f.c), Y = new le(f.c, v, S);
        for (f.h = B.length, v = 0, C = B.length; v < C; v++) B[v].load(function(ne, we, Ee) {
          p(f, Y, ne, we, Ee);
        });
      }
      function x(f, v) {
        this.c = f, this.a = v;
      }
      x.prototype.load = function(f) {
        function v() {
          if (Y["__mti_fntLst" + S]) {
            var ne = Y["__mti_fntLst" + S](), we = [], Ee;
            if (ne) for (var et = 0; et < ne.length; et++) {
              var Be = ne[et].fontfamily;
              ne[et].fontStyle != null && ne[et].fontWeight != null ? (Ee = ne[et].fontStyle + ne[et].fontWeight, we.push(new T(Be, Ee))) : we.push(new T(Be));
            }
            f(we);
          } else setTimeout(function() {
            v();
          }, 50);
        }
        var C = this, S = C.a.projectId, B = C.a.version;
        if (S) {
          var Y = C.c.o;
          M(this.c, (C.a.api || "https://fast.fonts.net/jsapi") + "/" + S + ".js" + (B ? "?v=" + B : ""), function(ne) {
            ne ? f([]) : (Y["__MonotypeConfiguration__" + S] = function() {
              return C.a;
            }, v());
          }).id = "__MonotypeAPIScript__" + S;
        } else f([]);
      };
      function F(f, v) {
        this.c = f, this.a = v;
      }
      F.prototype.load = function(f) {
        var v, C, S = this.a.urls || [], B = this.a.families || [], Y = this.a.testStrings || {}, ne = new K();
        for (v = 0, C = S.length; v < C; v++) P(this.c, S[v], Pe(ne));
        var we = [];
        for (v = 0, C = B.length; v < C; v++) if (S = B[v].split(":"), S[1]) for (var Ee = S[1].split(","), et = 0; et < Ee.length; et += 1) we.push(new T(S[0], Ee[et]));
        else we.push(new T(S[0]));
        fe(ne, function() {
          f(we, Y);
        });
      };
      function L(f, v) {
        f ? this.c = f : this.c = R, this.a = [], this.f = [], this.g = v || "";
      }
      var R = "https://fonts.googleapis.com/css";
      function U(f, v) {
        for (var C = v.length, S = 0; S < C; S++) {
          var B = v[S].split(":");
          B.length == 3 && f.f.push(B.pop());
          var Y = "";
          B.length == 2 && B[1] != "" && (Y = ":"), f.a.push(B.join(Y));
        }
      }
      function z(f) {
        if (f.a.length == 0) throw Error("No fonts to load!");
        if (f.c.indexOf("kit=") != -1) return f.c;
        for (var v = f.a.length, C = [], S = 0; S < v; S++) C.push(f.a[S].replace(/ /g, "+"));
        return v = f.c + "?family=" + C.join("%7C"), 0 < f.f.length && (v += "&subset=" + f.f.join(",")), 0 < f.g.length && (v += "&text=" + encodeURIComponent(f.g)), v;
      }
      function $(f) {
        this.f = f, this.a = [], this.c = {};
      }
      var D = { latin: "BESbswy", "latin-ext": "çöüğş", cyrillic: "йяЖ", greek: "αβΣ", khmer: "កខគ", Hanuman: "កខគ" }, J = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" }, H = { i: "i", italic: "i", n: "n", normal: "n" }, Z = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
      function te(f) {
        for (var v = f.f.length, C = 0; C < v; C++) {
          var S = f.f[C].split(":"), B = S[0].replace(/\+/g, " "), Y = ["n4"];
          if (2 <= S.length) {
            var ne, we = S[1];
            if (ne = [], we) for (var we = we.split(","), Ee = we.length, et = 0; et < Ee; et++) {
              var Be;
              if (Be = we[et], Be.match(/^[\w-]+$/)) {
                var ct = Z.exec(Be.toLowerCase());
                if (ct == null) Be = "";
                else {
                  if (Be = ct[2], Be = Be == null || Be == "" ? "n" : H[Be], ct = ct[1], ct == null || ct == "") ct = "4";
                  else var kt = J[ct], ct = kt || (isNaN(ct) ? "4" : ct.substr(0, 1));
                  Be = [Be, ct].join("");
                }
              } else Be = "";
              Be && ne.push(Be);
            }
            0 < ne.length && (Y = ne), S.length == 3 && (S = S[2], ne = [], S = S ? S.split(",") : ne, 0 < S.length && (S = D[S[0]]) && (f.c[B] = S));
          }
          for (f.c[B] || (S = D[B]) && (f.c[B] = S), S = 0; S < Y.length; S += 1) f.a.push(new T(B, Y[S]));
        }
      }
      function re(f, v) {
        this.c = f, this.a = v;
      }
      var me = { Arimo: !0, Cousine: !0, Tinos: !0 };
      re.prototype.load = function(f) {
        var v = new K(), C = this.c, S = new L(this.a.api, this.a.text), B = this.a.families;
        U(S, B);
        var Y = new $(B);
        te(Y), P(C, z(S), Pe(v)), fe(v, function() {
          f(Y.a, Y.c, me);
        });
      };
      function Te(f, v) {
        this.c = f, this.a = v;
      }
      Te.prototype.load = function(f) {
        var v = this.a.id, C = this.c.o;
        v ? M(this.c, (this.a.api || "https://use.typekit.net") + "/" + v + ".js", function(S) {
          if (S) f([]);
          else if (C.Typekit && C.Typekit.config && C.Typekit.config.fn) {
            S = C.Typekit.config.fn;
            for (var B = [], Y = 0; Y < S.length; Y += 2) for (var ne = S[Y], we = S[Y + 1], Ee = 0; Ee < we.length; Ee++) B.push(new T(ne, we[Ee]));
            try {
              C.Typekit.load({ events: !1, classes: !1, async: !0 });
            } catch {
            }
            f(B);
          }
        }, 2e3) : f([]);
      };
      function Fe(f, v) {
        this.c = f, this.f = v, this.a = [];
      }
      Fe.prototype.load = function(f) {
        var v = this.f.id, C = this.c.o, S = this;
        v ? (C.__webfontfontdeckmodule__ || (C.__webfontfontdeckmodule__ = {}), C.__webfontfontdeckmodule__[v] = function(B, Y) {
          for (var ne = 0, we = Y.fonts.length; ne < we; ++ne) {
            var Ee = Y.fonts[ne];
            S.a.push(new T(Ee.name, ze("font-weight:" + Ee.weight + ";font-style:" + Ee.style)));
          }
          f(S.a);
        }, M(this.c, (this.f.api || "https://f.fontdeck.com/s/css/js/") + m(this.c) + "/" + v + ".js", function(B) {
          B && f([]);
        })) : f([]);
      };
      var Ye = new pt(window);
      Ye.a.c.custom = function(f, v) {
        return new F(v, f);
      }, Ye.a.c.fontdeck = function(f, v) {
        return new Fe(v, f);
      }, Ye.a.c.monotype = function(f, v) {
        return new x(v, f);
      }, Ye.a.c.typekit = function(f, v) {
        return new Te(v, f);
      }, Ye.a.c.google = function(f, v) {
        return new re(v, f);
      };
      var ht = { load: s(Ye.load, Ye) };
      e.exports ? e.exports = ht : (window.WebFont = ht, window.WebFontConfig && Ye.load(window.WebFontConfig));
    })();
  }(Or)), Or.exports;
}
var bg = vg();
const wg = /* @__PURE__ */ yg(bg), il = [
  "Space Grotesk:400,500,600,700",
  "Instrument Sans:400,500,600",
  "JetBrains Mono:400,500,600"
], kg = (e) => {
  const t = [...il], n = (e == null ? void 0 : e.split(",")[0].trim().replace(/['"]/g, "")) || "", s = il.some(
    (i) => i.toLowerCase().startsWith(n.toLowerCase())
  );
  n && !s && t.push(n), wg.load({
    google: { families: t },
    active: () => {
      if (!e) return;
      const i = document.querySelector(".chat-container");
      i && (i.style.fontFamily = e.includes(",") ? e : `"${e}", system-ui, sans-serif`);
    }
  });
};
function xg() {
  const e = ie({}), t = ie(""), n = (i) => {
    var r;
    e.value = i, i.photo_url && (e.value.photo_url = i.photo_url), kg(i.font_family), window.parent.postMessage({
      type: "CUSTOMIZATION_UPDATE",
      data: {
        chat_bubble_color: i.chat_bubble_color || "#C9F24E",
        chat_style: i.chat_style,
        chat_initiation_messages: i.chat_initiation_messages || [],
        // Dashboard "Widget placement" defaults — the embed loader merges these
        // under any options the installing developer set.
        widget_display: (r = i.customization_metadata) == null ? void 0 : r.widget_display
      }
    }, "*");
  };
  return {
    customization: e,
    agentName: t,
    applyCustomization: n,
    initializeFromData: () => {
      const i = window.__INITIAL_DATA__;
      i && (n(i.customization || {}), t.value = i.agentName || "");
    }
  };
}
const Ag = 13, Tg = 24;
function Sg(e, t) {
  const n = Vi({}), s = [];
  let i = null;
  const r = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, o = (c) => {
    i || s.length === 0 || (i = setTimeout(a, c));
  }, a = () => {
    i = null;
    const c = s[0];
    if (c === void 0) return;
    const w = e.value[c], m = n[c], P = (w == null ? void 0 : w.message) ?? "";
    if (!m || !w) {
      s.shift(), o(0);
      return;
    }
    if (m.shown >= P.length) {
      m.done = !0, s.shift(), o(0);
      return;
    }
    m.shown += 1;
    const M = P[m.shown - 1];
    t == null || t(), o(M === " " ? Tg : Ag);
  };
  Wt(() => e.value.length, (c, w) => {
    w !== void 0 && c < w && (Object.keys(n).forEach((m) => {
      delete n[Number(m)];
    }), s.length = 0);
    for (let m = w ?? 0; m < c; m++) {
      const P = e.value[m];
      if (!P || !P.stream || m in n) continue;
      const M = P.message ?? "";
      r || !M ? n[m] = { shown: M.length, done: !0 } : (n[m] = { shown: 0, done: !1 }, s.push(m));
    }
    o(0);
  });
  const l = (c, w) => {
    const m = n[c];
    return m ? w.slice(0, m.shown) : w;
  }, h = (c) => {
    const w = n[c];
    return !!w && !w.done;
  };
  return Ys(() => {
    i && clearTimeout(i);
  }), { displayText: l, isStreaming: h };
}
function Eg(e) {
  const t = ie(!0);
  let n = 0;
  const s = () => {
    window.parent.postMessage({ type: "UNREAD_COUNT", count: n }, "*");
  }, i = (r) => {
    var o;
    ((o = r == null ? void 0 : r.data) == null ? void 0 : o.type) === "WIDGET_VISIBILITY" && (t.value = !!r.data.open, t.value && n !== 0 && (n = 0, s()));
  };
  Wt(() => e.value.length, (r, o) => {
    if (r <= (o ?? 0) || t.value) return;
    const a = e.value[r - 1];
    a && (a.message_type === "bot" || a.message_type === "agent") && (n += 1, s());
  }), Yi(() => window.addEventListener("message", i)), Ys(() => window.removeEventListener("message", i));
}
const Cg = {
  light: !1,
  mono: !1,
  radius: 22,
  bubble: 16,
  glow: "rgba(157,140,255,.26)",
  border: "rgba(157,140,255,.32)",
  card: "linear-gradient(180deg,rgba(28,26,40,.94),rgba(15,14,22,.97))",
  text: "#ECEAFA",
  muted: "#9C97BE",
  agentBg: "rgba(255,255,255,.06)",
  accent: "#9D8CFF"
}, Rg = {
  light: !1,
  mono: !1,
  radius: 26,
  bubble: 18,
  glow: "rgba(157,140,255,.32)",
  border: "rgba(157,140,255,.40)",
  card: "linear-gradient(180deg,#16131F,#0A0910)",
  text: "#F2F3F8",
  muted: "#A7A0CC",
  agentBg: "rgba(255,255,255,.05)",
  accent: "#9D8CFF"
}, Ig = {
  light: !1,
  mono: !0,
  radius: 8,
  bubble: 4,
  glow: "rgba(201,242,78,.20)",
  border: "rgba(201,242,78,.30)",
  card: "#070907",
  text: "#D7F7C8",
  muted: "#7F9B57",
  agentBg: "rgba(201,242,78,.045)",
  accent: "#C9F24E"
}, Lg = {
  light: !1,
  mono: !1,
  radius: 18,
  bubble: 14,
  glow: "rgba(95,227,214,.22)",
  border: "rgba(95,227,214,.30)",
  card: "linear-gradient(180deg,#0E1A1A,#0A1414)",
  text: "#DDF7F3",
  muted: "#6FAFA8",
  agentBg: "rgba(255,255,255,.05)",
  accent: "#5FE3D6"
}, Og = {
  light: !0,
  mono: !1,
  radius: 28,
  bubble: 20,
  glow: "rgba(255,138,115,.30)",
  border: "rgba(0,0,0,.07)",
  card: "#FFFFFF",
  text: "#2A2730",
  muted: "#9A93A3",
  agentBg: "#F4F1F6",
  accent: "#FF8A73"
}, Ri = {
  light: !0,
  mono: !1,
  radius: 24,
  bubble: 16,
  glow: "rgba(255,138,115,.22)",
  border: "rgba(0,0,0,.08)",
  card: "#FFFFFF",
  text: "#2A2A33",
  muted: "#8A8A99",
  agentBg: "#F3F3F6",
  accent: "#FF8A73"
}, Ng = {
  GLASS: Cg,
  AURORA: Rg,
  TERMINAL: Ig,
  CALM_MINT: Lg,
  PLAYFUL: Og,
  SUNRISE: Ri,
  CHATBOT: Ri,
  ASK_ANYTHING: Ri
}, Pg = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", rl = "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
function Mg(e) {
  return Math.max(4, Math.round(e * 0.3));
}
function ol(e) {
  const t = (e || "").replace("#", "");
  if (t.length < 6) return "#0B0C10";
  const n = parseInt(t.slice(0, 2), 16), s = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
  return (0.299 * n + 0.587 * s + 0.114 * i) / 255 > 0.62 ? "#0B0C10" : "#FFFFFF";
}
function Fg(e) {
  return Ng[e || ""] || Ri;
}
const Dg = "#212529";
function Bg(e, t) {
  const n = Fg(e), s = (t == null ? void 0 : t.chat_background_color) || "", i = /^#[0-9a-fA-F]{6}$/.test(s), r = s || n.card, o = (t == null ? void 0 : t.chat_text_color) || "", l = /^#[0-9a-fA-F]{6}$/.test(o) && o.toLowerCase() !== Dg ? o : i ? ls(s) ? "#FFFFFF" : "#111111" : n.text, h = i ? ls(s) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" : n.muted, c = i ? Hh(s, 20) : n.agentBg, w = (t == null ? void 0 : t.accent_color) || n.accent, m = i ? !ls(s) : n.light, P = ol(w) === "#0B0C10", M = m === P ? h : w, K = n.mono ? Pg : t != null && t.font_family ? `${t.font_family}, ${rl}` : rl;
  return {
    "--cm-card": r,
    "--cm-text": l,
    "--cm-muted": h,
    "--cm-agent-bg": c,
    "--cm-accent": w,
    "--cm-on-accent": ol(w),
    "--cm-presence": M,
    "--cm-border": n.border,
    "--cm-glow": n.glow,
    "--cm-radius": `${n.radius}px`,
    "--cm-bubble": `${n.bubble}px`,
    "--cm-bubble-tail": `${Mg(n.bubble)}px`,
    "--cm-field-radius": n.mono ? "7px" : "12px",
    "--cm-avatar-radius": n.mono ? "28%" : "50%",
    "--cm-hairline": n.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    "--cm-body-font": K
  };
}
function $g() {
  const e = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
    CAD: "CA$",
    AUD: "A$",
    CNY: "¥",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    NZD: "NZ$",
    SGD: "S$",
    HKD: "HK$",
    KRW: "₩",
    MXN: "MX$",
    BRL: "R$",
    ZAR: "R",
    RUB: "₽",
    TRY: "₺",
    THB: "฿",
    PLN: "zł",
    AED: "د.إ",
    SAR: "﷼",
    ILS: "₪",
    MYR: "RM"
  };
  return {
    formatCurrency: (s, i) => {
      if (!s && s !== 0) return "";
      const r = i ? e[i] || i : "", o = typeof s == "string" ? s : s.toString();
      return r ? `${r}${o}` : o;
    },
    getCurrencySymbol: (s) => e[s] || s,
    currencySymbols: e
  };
}
const Ug = {
  key: 0,
  class: "widget-unavailable-overlay"
}, zg = {
  key: 1,
  class: "auth-error-overlay"
}, Hg = { class: "auth-error-card" }, qg = { class: "auth-error-message" }, Wg = {
  key: 0,
  class: "initializing-overlay"
}, jg = {
  key: 0,
  class: "connecting-message"
}, Vg = {
  key: 1,
  class: "failed-message"
}, Kg = { class: "welcome-content" }, Gg = { class: "welcome-header" }, Yg = ["src", "alt"], Xg = { class: "welcome-title" }, Zg = { class: "welcome-subtitle" }, Jg = { class: "welcome-input-container" }, Qg = {
  key: 0,
  class: "email-input"
}, em = ["disabled"], tm = { class: "welcome-message-input" }, nm = ["placeholder", "disabled"], sm = ["disabled"], im = {
  key: 0,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, rm = {
  key: 1,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, om = { class: "landing-page-content" }, am = { class: "landing-page-header" }, lm = { class: "landing-page-heading" }, cm = { class: "landing-page-text" }, um = { class: "landing-page-actions" }, fm = { class: "form-fullscreen-content" }, hm = {
  key: 0,
  class: "form-header"
}, dm = {
  key: 0,
  class: "form-title"
}, pm = {
  key: 1,
  class: "form-description"
}, gm = { class: "form-fields" }, mm = ["for"], _m = {
  key: 0,
  class: "required-indicator"
}, ym = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "autocomplete", "inputmode"], vm = ["id", "placeholder", "required", "min", "max", "value", "onInput"], bm = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput"], wm = ["id", "required", "value", "onChange"], km = { value: "" }, xm = ["value"], Am = {
  key: 4,
  class: "checkbox-field"
}, Tm = ["id", "required", "checked", "onChange"], Sm = { class: "checkbox-label" }, Em = {
  key: 5,
  class: "radio-group"
}, Cm = ["name", "value", "required", "checked", "onChange"], Rm = { class: "radio-label" }, Im = {
  key: 6,
  class: "field-error"
}, Lm = { class: "form-actions" }, Om = ["disabled"], Nm = {
  key: 0,
  class: "loading-spinner-inline"
}, Pm = { key: 1 }, Mm = { class: "header-content" }, Fm = ["src", "alt"], Dm = { class: "header-info" }, Bm = { class: "header-actions" }, $m = ["disabled", "title", "aria-label"], Um = {
  key: 0,
  class: "new-chat-hint"
}, zm = { class: "ask-anything-header" }, Hm = ["src", "alt"], qm = { class: "header-info" }, Wm = {
  key: 2,
  class: "loading-history"
}, jm = { class: "cm-email-gate-title" }, Vm = ["disabled"], Km = {
  key: 0,
  class: "cm-email-gate-error"
}, Gm = ["disabled"], Ym = {
  key: 0,
  class: "cm-welcome-block"
}, Xm = { class: "message agent-message cm-welcome-row" }, Zm = ["src", "alt"], Jm = {
  key: 0,
  class: "cm-msg-avatar",
  "aria-hidden": "true"
}, Qm = ["src"], e_ = ["src"], t_ = { class: "message-col" }, n_ = {
  key: 0,
  class: "rating-content"
}, s_ = { class: "rating-prompt" }, i_ = ["onMouseover", "onMouseleave", "onClick", "disabled"], r_ = {
  key: 0,
  class: "feedback-wrapper"
}, o_ = { class: "feedback-section" }, a_ = ["onUpdate:modelValue", "disabled"], l_ = { class: "feedback-counter" }, c_ = ["onClick", "disabled"], u_ = {
  key: 1,
  class: "submitted-feedback-wrapper"
}, f_ = { class: "submitted-feedback" }, h_ = { class: "submitted-feedback-text" }, d_ = {
  key: 2,
  class: "submitted-message"
}, p_ = {
  key: 1,
  class: "form-content"
}, g_ = {
  key: 0,
  class: "form-header"
}, m_ = {
  key: 0,
  class: "form-title"
}, __ = {
  key: 1,
  class: "form-description"
}, y_ = { class: "form-fields" }, v_ = ["for"], b_ = {
  key: 0,
  class: "required-indicator"
}, w_ = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "disabled", "autocomplete", "inputmode"], k_ = ["id", "placeholder", "required", "min", "max", "value", "onInput", "disabled"], x_ = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "disabled"], A_ = ["id", "required", "value", "onChange", "disabled"], T_ = { value: "" }, S_ = ["value"], E_ = {
  key: 4,
  class: "checkbox-field"
}, C_ = ["id", "checked", "onChange", "disabled"], R_ = ["for"], I_ = {
  key: 5,
  class: "radio-field"
}, L_ = ["id", "name", "value", "checked", "onChange", "disabled"], O_ = ["for"], N_ = {
  key: 6,
  class: "field-error"
}, P_ = { class: "form-actions" }, M_ = ["onClick", "disabled"], F_ = {
  key: 2,
  class: "user-input-content"
}, D_ = {
  key: 0,
  class: "user-input-prompt"
}, B_ = {
  key: 1,
  class: "user-input-form"
}, $_ = ["onUpdate:modelValue", "onKeydown"], U_ = ["onClick", "disabled"], z_ = {
  key: 2,
  class: "user-input-submitted"
}, H_ = {
  key: 0,
  class: "user-input-confirmation"
}, q_ = {
  key: 3,
  class: "product-message-container"
}, W_ = ["innerHTML"], j_ = {
  key: 1,
  class: "products-carousel"
}, V_ = { class: "carousel-items" }, K_ = {
  key: 0,
  class: "product-image-compact"
}, G_ = ["src", "alt"], Y_ = { class: "product-info-compact" }, X_ = { class: "product-text-area" }, Z_ = { class: "product-title-compact" }, J_ = {
  key: 0,
  class: "product-variant-compact"
}, Q_ = { class: "product-price-compact" }, ey = { class: "product-actions-compact" }, ty = ["onClick"], ny = {
  key: 2,
  class: "no-products-message"
}, sy = {
  key: 3,
  class: "no-products-message"
}, iy = ["innerHTML"], ry = ["innerHTML"], oy = {
  key: 2,
  class: "message-attachments"
}, ay = {
  key: 0,
  class: "attachment-image-container"
}, ly = ["src", "alt", "onClick"], cy = { class: "attachment-image-info" }, uy = ["href"], fy = { class: "attachment-size" }, hy = ["href"], dy = { class: "attachment-size" }, py = {
  key: 0,
  class: "citation-chips"
}, gy = ["title"], my = { class: "message-info" }, _y = {
  key: 0,
  class: "agent-name"
}, yy = {
  key: 4,
  class: "cm-quick-actions-bar"
}, vy = ["disabled", "onClick"], by = {
  key: 0,
  class: "file-previews-widget"
}, wy = {
  class: "file-preview-content-widget",
  style: { cursor: "pointer" }
}, ky = ["src", "alt", "onClick"], xy = ["onClick"], Ay = { class: "file-preview-info-widget" }, Ty = { class: "file-preview-name-widget" }, Sy = { class: "file-preview-size-widget" }, Ey = ["onClick"], Cy = {
  key: 1,
  class: "upload-progress-widget"
}, Ry = { class: "message-input" }, Iy = ["placeholder", "disabled"], Ly = ["disabled", "title"], Oy = ["disabled"], Ny = {
  key: 6,
  class: "new-conversation-section"
}, Py = { class: "conversation-ended-message" }, My = {
  key: 8,
  class: "rating-dialog"
}, Fy = { class: "rating-content" }, Dy = { class: "star-rating" }, By = ["onClick"], $y = { class: "rating-actions" }, Uy = ["disabled"], zy = {
  key: 0,
  class: "preview-modal-image-container"
}, Hy = ["src", "alt"], qy = { class: "preview-modal-filename" }, Wy = {
  key: 3,
  class: "widget-loading"
}, Is = "ctid", al = 3, jy = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls", Vy = /* @__PURE__ */ Dl({
  __name: "WidgetBuilder",
  props: {
    widgetId: {},
    token: {},
    initialAuthError: {}
  },
  setup(e) {
    var Go;
    const t = e, n = ce(() => {
      var d;
      return t.widgetId || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.widgetId);
    }), {
      customization: s,
      agentName: i,
      applyCustomization: r,
      initializeFromData: o
    } = xg(), { formatCurrency: a } = $g(), {
      messages: l,
      loading: h,
      errorMessage: c,
      showError: w,
      loadingHistory: m,
      hasStartedChat: P,
      connectionStatus: M,
      sendMessage: K,
      endChat: Pe,
      loadChatHistory: fe,
      connect: ge,
      reconnect: ve,
      cleanup: T,
      humanAgent: I,
      onTakeover: j,
      submitRating: G,
      submitForm: Ae,
      currentForm: ze,
      getWorkflowState: Ze,
      proceedWorkflow: Re,
      onWorkflowState: ye,
      onWorkflowProceeded: Qe,
      currentSessionId: it,
      setToken: lt,
      setWidgetId: ue
    } = _g(), { displayText: de, isStreaming: ae } = Sg(l, () => os(() => An()));
    Eg(l);
    const Se = ie(""), rt = ie(!0), oe = ie(""), Me = ie(!1), De = (d) => {
      const g = d.target;
      Se.value = g.value;
    };
    let yt = null;
    const Ie = () => {
      yt && yt.disconnect(), yt = new MutationObserver((g) => {
        let u = !1, Q = !1;
        g.forEach((be) => {
          if (be.type === "childList") {
            const he = Array.from(be.addedNodes).some(
              (ke) => {
                var Yt;
                return ke.nodeType === Node.ELEMENT_NODE && (ke.matches("input, textarea") || ((Yt = ke.querySelector) == null ? void 0 : Yt.call(ke, "input, textarea")));
              }
            ), Je = Array.from(be.removedNodes).some(
              (ke) => {
                var Yt;
                return ke.nodeType === Node.ELEMENT_NODE && (ke.matches("input, textarea") || ((Yt = ke.querySelector) == null ? void 0 : Yt.call(ke, "input, textarea")));
              }
            );
            he && (Q = !0, u = !0), Je && (u = !0);
          }
        }), u && (clearTimeout(Ie.timeoutId), Ie.timeoutId = setTimeout(() => {
          Ne();
        }, Q ? 50 : 100));
      });
      const d = document.querySelector(".widget-container") || document.body;
      yt.observe(d, {
        childList: !0,
        subtree: !0
      });
    };
    Ie.timeoutId = null;
    let q = [];
    const Ne = () => {
      le();
      const d = [
        '.widget-container input[type="text"]',
        '.chat-container input[type="text"]',
        ".message-input input",
        ".welcome-message-field",
        ".ask-anything-field",
        'input[placeholder*="message"]',
        'input[placeholder*="Type"]',
        'input[placeholder*="Ask"]',
        "input.message-input",
        "textarea",
        // More specific selectors for the widget context
        ".widget-container input",
        ".chat-input input",
        "input"
      ];
      let g = [];
      for (const u of d) {
        const Q = document.querySelectorAll(u);
        if (Q.length > 0) {
          g = Array.from(Q);
          break;
        }
      }
      g.length !== 0 && (q = g, g.forEach((u) => {
        u.addEventListener("input", V, !0), u.addEventListener("keyup", V, !0), u.addEventListener("change", V, !0), u.addEventListener("keypress", pt, !0), u.addEventListener("keydown", p, !0);
      }));
    }, le = () => {
      q.forEach((d) => {
        d.removeEventListener("input", V), d.removeEventListener("keyup", V), d.removeEventListener("change", V), d.removeEventListener("keypress", pt), d.removeEventListener("keydown", p);
      }), q = [];
    }, Le = (d) => !!(d && d.closest && d.closest(".form-message, .form-fullscreen, .cm-email-gate")), V = (d) => {
      if (Le(d.target)) return;
      const g = d.target;
      Se.value = g.value;
    }, pt = (d) => {
      Le(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), en());
    }, p = (d) => {
      Le(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), en());
    }, y = (d) => {
      const g = d.target, u = document.querySelector(".header-menu-container");
      document.querySelector(".header-menu-btn");
      const Q = document.querySelector(".header-dropdown-menu");
      Q && !(u != null && u.contains(g)) && (Q.style.display = "none");
    }, x = ie(!0), F = (d) => !d || d === "undefined" || d === "null" || typeof d == "string" && d.trim() === "" ? null : d, L = ie(F(((Go = window.__INITIAL_DATA__) == null ? void 0 : Go.initialToken) || localStorage.getItem(Is)));
    ce(() => !!L.value);
    const R = ie(null), U = ie(!1), z = ie(!1);
    t.initialAuthError && (R.value = t.initialAuthError, U.value = !0, x.value = !1), o();
    const $ = window.__INITIAL_DATA__;
    if ($ != null && $.initialToken) {
      const d = F($.initialToken);
      d && (L.value = d, window.parent.postMessage({
        type: "TOKEN_UPDATE",
        token: d
      }, "*"), Me.value = !0);
    }
    const D = ie(!1);
    ($ == null ? void 0 : $.allowAttachments) !== void 0 && (D.value = $.allowAttachments);
    const J = ie(null), {
      chatStyles: H,
      chatIconStyles: Z,
      agentBubbleStyles: te,
      userBubbleStyles: re,
      messageNameStyles: me,
      headerBorderStyles: Te,
      photoUrl: Fe,
      shadowStyle: Ye
    } = wp(s), ht = ie(null), {
      uploadedAttachments: f,
      previewModal: v,
      previewFile: C,
      formatFileSize: S,
      isImageAttachment: B,
      getDownloadUrl: Y,
      getPreviewUrl: ne,
      handleFileSelect: we,
      handleDrop: Ee,
      handleDragOver: et,
      handleDragLeave: Be,
      handlePaste: ct,
      removeAttachment: kt,
      openPreview: Xe,
      closePreview: Pt,
      openFilePicker: Js,
      isImage: fs
    } = Ap(L, ht);
    ce(() => l.value.some(
      (d) => d.message_type === "form" && (!d.isSubmitted || d.isSubmitted === !1)
    ));
    const Mt = ce(() => {
      var d;
      return P.value && Me.value || !cr.value ? M.value === "connected" && !h.value : ws(oe.value.trim()) && M.value === "connected" && !h.value || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.workflow);
    }), Gn = ce(() => M.value === "connected" ? zt.value ? "Ask me anything..." : "Type a message..." : "Connecting..."), en = async () => {
      if (!Se.value.trim() && f.value.length === 0) return;
      !P.value && oe.value && await xn();
      const d = f.value.map((u) => ({
        content: u.content,
        // base64 content
        filename: u.filename,
        content_type: u.type,
        size: u.size
      }));
      await K(Se.value, oe.value, d), f.value.forEach((u) => {
        u.url && u.url.startsWith("blob:") && URL.revokeObjectURL(u.url), u.file_url && u.file_url.startsWith("blob:") && URL.revokeObjectURL(u.file_url);
      }), Se.value = "", f.value = [];
      const g = document.querySelector('input[placeholder*="Type a message"]');
      g && (g.value = ""), setTimeout(() => {
        Ne();
      }, 500);
    }, Qs = (d) => {
      Mt.value && (Se.value = d, en());
    }, xt = () => {
      window.parent.postMessage({ type: "WIDGET_MINIMIZE" }, "*");
    }, fn = (d) => {
      d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), en());
    }, xn = async () => {
      var d, g, u, Q;
      try {
        if (!n.value)
          return console.error("Widget ID is not available"), R.value = "Widget ID is not available. Please refresh and try again.", U.value = !0, !1;
        const be = new URL(`${Ks.API_URL}/widgets/${n.value}`);
        oe.value.trim() && ws(oe.value.trim()) && be.searchParams.append("email", oe.value.trim());
        const he = {
          Accept: "application/json",
          "Content-Type": "application/json"
        };
        L.value && (he.Authorization = `Bearer ${L.value}`);
        const Je = await fetch(be, {
          headers: he
        });
        if (Je.status === 401) {
          Me.value = !1;
          try {
            const Jn = (await Je.json()).detail || "";
            (Jn.includes("generate-token") || Jn.includes("API key") || Jn.includes("Token required")) && (z.value = !0, R.value = "Widget authentication not configured. Please contact the website administrator.", U.value = !0, localStorage.removeItem(Is), L.value = null);
          } catch {
            R.value = "Authentication required. Your token has expired or is invalid. Please refresh the page.", U.value = !0, localStorage.removeItem(Is), L.value = null;
          }
          return !1;
        }
        if (!Je.ok) {
          try {
            const _s = await Je.json();
            R.value = _s.detail || `Error: ${Je.statusText}`;
          } catch {
            R.value = `Error: ${Je.statusText}. Please try again.`;
          }
          return U.value = !0, !1;
        }
        const ke = await Je.json();
        return ke.token && (L.value = ke.token, localStorage.setItem(Is, ke.token), window.parent.postMessage({ type: "TOKEN_UPDATE", token: ke.token }, "*")), Me.value = !0, R.value = null, U.value = !1, lt(L.value || void 0), await ge() ? (await ei(), (d = ke.agent) != null && d.customization && r(ke.agent.customization), ke.agent && !(ke != null && ke.human_agent) && (i.value = ke.agent.name), ke != null && ke.human_agent && (I.value = ke.human_agent), ((g = ke.agent) == null ? void 0 : g.allow_attachments) !== void 0 && (D.value = ke.agent.allow_attachments), ((u = ke.agent) == null ? void 0 : u.workflow) !== void 0 && (window.__INITIAL_DATA__ = window.__INITIAL_DATA__ || {}, window.__INITIAL_DATA__.workflow = ke.agent.workflow), (Q = ke.agent) != null && Q.workflow && await Ze(), !0) : (console.error("Failed to connect to chat service"), R.value = "Failed to connect to chat service. Please try again.", U.value = !0, !1);
      } catch (be) {
        return console.error("Error checking authorization:", be), R.value = "An unexpected error occurred. Please try again.", U.value = !0, Me.value = !1, !1;
      } finally {
        x.value = !1;
      }
    }, ei = async () => {
      !P.value && Me.value && (P.value = !0, await fe());
    }, An = () => {
      J.value && (J.value.scrollTop = J.value.scrollHeight);
    };
    Wt(() => l.value, (d) => {
      os(() => {
        An();
      });
    }, { deep: !0 }), Wt(M, (d, g) => {
      d === "connected" && g !== "connected" && setTimeout(Ne, 100);
    }), Wt(() => l.value.length, (d, g) => {
      d > 0 && g === 0 && setTimeout(Ne, 100);
    });
    let hs = null;
    Wt(() => l.value, (d) => {
      const g = d[d.length - 1];
      !Ya(g) || g === hs || (hs = g, ps(g));
    }, { deep: !0 });
    const Gt = async () => {
      await ve() && await xn();
    }, ds = ie(!1), Dn = ie(0), Yn = ie(""), Ft = ie(0), Ut = ie(!1), W = ie({}), _ = ie(!1), N = ie({}), X = ie(!1), He = ie(null), dt = ie("Start Chat"), tt = ie(!1), qe = ie(null);
    ce(() => {
      var g;
      const d = l.value[l.value.length - 1];
      return ((g = d == null ? void 0 : d.attributes) == null ? void 0 : g.request_rating) || !1;
    });
    const At = ce(() => {
      var g;
      if (!((g = window.__INITIAL_DATA__) != null && g.workflow))
        return !1;
      const d = l.value.find((u) => u.message_type === "rating");
      return (d == null ? void 0 : d.isSubmitted) === !0;
    }), Dt = ce(
      () => Ui(I.value.human_agent_profile_pic)
    ), ps = async (d) => {
      var g, u, Q, be, he;
      if (Ya(d)) {
        try {
          if (d.session_id && L.value && n.value) {
            const Je = new URL(`${Ks.API_URL}/widgets/${n.value}/end-chat`);
            Je.searchParams.append("session_id", d.session_id), (g = d.attributes) != null && g.end_chat_reason && Je.searchParams.append("reason", d.attributes.end_chat_reason), (u = d.attributes) != null && u.end_chat_description && Je.searchParams.append("description", d.attributes.end_chat_description);
            const ke = await fetch(Je, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${L.value}`,
                "Content-Type": "application/json"
              }
            });
            if (ke.ok) {
              const Yt = await ke.json();
              console.info(`✓ Chat session closed on backend: ${Yt.session_id}`);
            } else
              console.warn(`Failed to close session on backend: ${ke.status}`);
          }
        } catch (Je) {
          console.error("Error calling end-chat API:", Je);
        }
        if ((Q = d.attributes) != null && Q.end_chat && ((be = d.attributes) != null && be.request_rating)) {
          const Je = d.agent_name || ((he = I.value) == null ? void 0 : he.human_agent_name) || i.value || "our agent";
          l.value.push({
            message: `Rate the chat session that you had with ${Je}`,
            message_type: "rating",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            session_id: d.session_id,
            agent_name: Je,
            showFeedback: !1
          }), it.value = d.session_id;
        }
      }
    }, gt = (d) => {
      Ut.value || (Ft.value = d);
    }, ti = () => {
      if (!Ut.value) {
        const d = l.value[l.value.length - 1];
        Ft.value = (d == null ? void 0 : d.selectedRating) || 0;
      }
    }, ni = async (d) => {
      if (!Ut.value) {
        Ft.value = d;
        const g = l.value[l.value.length - 1];
        g && g.message_type === "rating" && (g.showFeedback = !0, g.selectedRating = d);
      }
    }, Kc = async (d, g, u = null) => {
      try {
        Ut.value = !0, await G(g, u);
        const Q = l.value.find((be) => be.message_type === "rating");
        Q && (Q.isSubmitted = !0, Q.finalRating = g, Q.finalFeedback = u);
      } catch (Q) {
        console.error("Failed to submit rating:", Q);
      } finally {
        Ut.value = !1;
      }
    }, Gc = (d) => {
      const g = {};
      for (const u of d.fields) {
        const Q = W.value[u.name], be = sr(u, Q);
        be && (g[u.name] = be);
      }
      return N.value = g, Object.keys(g).length === 0;
    }, Yc = async (d) => {
      if (!(_.value || !Gc(d)))
        try {
          _.value = !0, await Ae(W.value);
          const u = l.value.findIndex(
            (Q) => Q.message_type === "form" && (!Q.isSubmitted || Q.isSubmitted === !1)
          );
          u !== -1 && l.value.splice(u, 1), W.value = {}, N.value = {};
        } catch (u) {
          console.error("Failed to submit form:", u);
        } finally {
          _.value = !1;
        }
    }, Ot = (d, g) => {
      var u, Q;
      if (W.value[d] = g, g && g.toString().trim() !== "") {
        let be = null;
        if ((u = qe.value) != null && u.fields && (be = qe.value.fields.find((he) => he.name === d)), !be && ((Q = ze.value) != null && Q.fields) && (be = ze.value.fields.find((he) => he.name === d)), be) {
          const he = sr(be, g);
          he ? (N.value[d] = he, console.log(`Validation error for ${d}:`, he)) : delete N.value[d];
        }
      } else
        delete N.value[d], console.log(`Cleared error for ${d}`);
    }, Xc = (d) => {
      const g = d.replace(/\D/g, "");
      return g.length >= 7 && g.length <= 15;
    }, sr = (d, g) => {
      if (d.required && (!g || g.toString().trim() === ""))
        return `${d.label} is required`;
      if (!g || g.toString().trim() === "")
        return null;
      if (d.type === "email" && !ws(g))
        return "Please enter a valid email address";
      if (d.type === "tel" && !Xc(g))
        return "Please enter a valid phone number";
      if ((d.type === "text" || d.type === "textarea") && d.minLength && g.length < d.minLength)
        return `${d.label} must be at least ${d.minLength} characters`;
      if ((d.type === "text" || d.type === "textarea") && d.maxLength && g.length > d.maxLength)
        return `${d.label} must not exceed ${d.maxLength} characters`;
      if (d.type === "number") {
        const u = parseFloat(g);
        if (isNaN(u))
          return `${d.label} must be a valid number`;
        if (d.minLength && u < d.minLength)
          return `${d.label} must be at least ${d.minLength}`;
        if (d.maxLength && u > d.maxLength)
          return `${d.label} must not exceed ${d.maxLength}`;
      }
      return null;
    }, Zc = async () => {
      if (!(_.value || !qe.value))
        try {
          _.value = !0, N.value = {};
          let d = !1;
          for (const g of qe.value.fields || []) {
            const u = W.value[g.name], Q = sr(g, u);
            Q && (N.value[g.name] = Q, d = !0, console.log(`Validation error for field ${g.name}:`, Q));
          }
          if (d) {
            _.value = !1, console.log("Validation failed, not submitting");
            return;
          }
          await Ae(W.value), tt.value = !1, qe.value = null, W.value = {};
        } catch (d) {
          console.error("Failed to submit full screen form:", d);
        } finally {
          _.value = !1, console.log("Full screen form submission completed");
        }
    }, Jc = (d, g) => {
      if (console.log("handleViewDetails called with:", { product: d, shopDomain: g }), !d) {
        console.error("No product provided to handleViewDetails");
        return;
      }
      let u = null;
      if (d.handle && g)
        u = `https://${g}/products/${d.handle}`;
      else if (d.id && g)
        u = `https://${g}/products/${d.id}`;
      else if (g) {
        if (!d.handle && !d.id) {
          console.error("Product handle and ID are both missing! Product:", d), alert("Unable to open product: Product information incomplete.");
          return;
        }
      } else {
        console.error("Shop domain is missing! Product:", d), alert("Unable to open product: Shop domain not available. Please contact support.");
        return;
      }
      u && (console.log("Opening product URL:", u), window.open(u, "_blank"));
    }, Qc = (d) => {
      if (!d) return "";
      let g = d.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
      const u = [];
      return g = g.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (Q, be, he) => {
        const Je = `__MARKDOWN_LINK_${u.length}__`;
        return console.log("Found markdown link:", Q, "-> placeholder:", Je), u.push(Q), Je;
      }), console.log("After replacing markdown links with placeholders:", g), console.log("Markdown links array:", u), g = g.replace(/https?:\/\/[^\s\)]+/g, "[link removed]"), console.log("After removing standalone URLs:", g), u.forEach((Q, be) => {
        g = g.replace(`__MARKDOWN_LINK_${be}__`, Q), console.log(`Restored markdown link ${be}:`, Q);
      }), g = g.replace(/\n\s*\n\s*\n/g, `

`).trim(), g;
    }, Mo = ie(!1);
    ie(!1);
    const Fo = ce(() => {
      var d;
      return !!((d = I.value) != null && d.human_agent_name);
    }), eu = ce(() => D.value && Fo.value && f.value.length < al), tu = async () => {
      try {
        X.value = !1, He.value = null, await Re();
      } catch (d) {
        console.error("Failed to proceed workflow:", d);
      }
    }, ir = async (d) => {
      try {
        if (!d.userInputValue || !d.userInputValue.trim())
          return;
        const g = d.userInputValue.trim();
        d.isSubmitted = !0, d.submittedValue = g, await K(g, oe.value);
      } catch (g) {
        console.error("Failed to submit user input:", g), d.isSubmitted = !1, d.submittedValue = null;
      }
    }, rr = async () => {
      var d, g, u;
      try {
        let Q = 0;
        const be = 50;
        for (; !((d = window.__INITIAL_DATA__) != null && d.widgetId) && Q < be; )
          await new Promise((Je) => setTimeout(Je, 100)), Q++;
        return (g = window.__INITIAL_DATA__) != null && g.widgetId ? (ue(window.__INITIAL_DATA__.widgetId), await xn() ? ((u = window.__INITIAL_DATA__) != null && u.workflow && Me.value && await Ze(), !0) : (M.value = "connected", !1)) : (console.error("Widget data not available after waiting"), !1);
      } catch (Q) {
        return console.error("Failed to initialize widget:", Q), !1;
      }
    };
    window.addEventListener("message", (d) => {
      d.source === window.parent && (!d.data || typeof d.data.type != "string" || (d.data.type === "SCROLL_TO_BOTTOM" && An(), d.data.type === "TOKEN_RECEIVED" && localStorage.setItem(Is, d.data.token), d.data.type === "WIDGET_VISIBILITY" && (Vo.value = !!d.data.open), d.data.type === "WIDGET_DISPLAY" && (ur.value = {
        mode: d.data.mode,
        width: d.data.width,
        height: d.data.height,
        hotkey: d.data.hotkey
      }), d.data.type === "PREFILL_MESSAGE" && typeof d.data.text == "string" && (Se.value = d.data.text.slice(0, 2e3), os(() => {
        const g = document.querySelector(
          ".message-input input, .welcome-message-field"
        );
        g == null || g.focus();
      }))));
    });
    const nu = () => {
      j(async () => {
        await xn();
      }), ye((d) => {
        var g;
        if (dt.value = d.button_text || "Start Chat", d.type === "landing_page")
          He.value = d.landing_page_data, X.value = !0, tt.value = !1;
        else if (d.type === "form" || d.type === "display_form")
          if (((g = d.form_data) == null ? void 0 : g.form_full_screen) === !0)
            qe.value = d.form_data, tt.value = !0, X.value = !1;
          else {
            const u = {
              message: "",
              message_type: "form",
              attributes: {
                form_data: d.form_data
              },
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              isSubmitted: !1
            };
            l.value.findIndex(
              (be) => be.message_type === "form" && !be.isSubmitted
            ) === -1 && l.value.push(u), X.value = !1, tt.value = !1;
          }
        else
          X.value = !1, tt.value = !1;
      }), Qe((d) => {
        console.log("Workflow proceeded:", d);
      });
    }, su = async () => {
      try {
        await rr(), await Ze();
      } catch (d) {
        throw console.error("Failed to start new conversation:", d), d;
      }
    }, Do = ce(
      () => {
        var d;
        return s.value.allow_new_chat === !0 && l.value.length > 0 && !((d = I.value) != null && d.human_agent_name) && !Bn.value;
      }
    ), Xn = ie(!1), Tn = ie(!1);
    let si = null;
    const ii = () => {
      Tn.value = !1, si && (clearTimeout(si), si = null);
    }, Bo = () => {
      if (!Xn.value) {
        if (!Tn.value) {
          Tn.value = !0, si = setTimeout(ii, 8e3);
          return;
        }
        ii(), iu();
      }
    }, iu = async () => {
      if (!Xn.value) {
        Xn.value = !0;
        try {
          await Pe(), I.value = {}, Se.value = "", f.value = [], await rr();
        } catch (d) {
          console.error("Failed to start a new chat:", d);
        } finally {
          Xn.value = !1;
        }
      }
    }, ru = async () => {
      At.value = !1, l.value = [], I.value = {}, await su();
    };
    Yi(async () => {
      await rr(), nu(), Ie(), document.addEventListener("click", y), (() => {
        const g = l.value.length > 0, u = M.value === "connected", Q = document.querySelector('input[type="text"], textarea') !== null;
        return g || u || Q;
      })() && setTimeout(Ne, 100);
    }), Ys(() => {
      window.removeEventListener("message", (d) => {
        d.data.type === "SCROLL_TO_BOTTOM" && An();
      }), document.removeEventListener("click", y), yt && (yt.disconnect(), yt = null), Ie.timeoutId && (clearTimeout(Ie.timeoutId), Ie.timeoutId = null), le(), T();
    });
    const Zn = ce(() => s.value.chat_style === "AURORA"), zt = ce(() => s.value.chat_style === "ASK_ANYTHING" || Zn.value), $o = ce(() => s.value.customization_metadata), ri = ce(() => {
      var g;
      const d = (g = $o.value) == null ? void 0 : g.avatar_style;
      return d === "orb" ? !0 : d === "photo" ? !1 : Zn.value && !s.value.photo_url;
    }), gs = ce(() => {
      var d;
      return yp(i.value || "", (d = $o.value) == null ? void 0 : d.orb_variant);
    }), ou = {
      GLASS: "theme-glass",
      TERMINAL: "theme-terminal",
      PLAYFUL: "theme-playful",
      CALM_MINT: "theme-calm",
      SUNRISE: "theme-sunrise"
    }, au = ce(() => ou[s.value.chat_style] || ""), lu = ce(() => Bg(s.value.chat_style, {
      chat_background_color: s.value.chat_background_color,
      chat_text_color: s.value.chat_text_color,
      accent_color: s.value.accent_color,
      font_family: s.value.font_family
    })), or = ce(
      () => Array.isArray(s.value.quick_actions) ? s.value.quick_actions.filter((d) => !!d && d.trim().length > 0) : []
    ), Uo = ce(() => (s.value.welcome_message || "").trim()), zo = ce(
      () => !zt.value && l.value.length === 0 && !m.value && !Bn.value
    ), cu = ce(
      () => zo.value && Uo.value.length > 0
    ), uu = ce(
      () => zo.value && !At.value && or.value.length > 0
    ), oi = ce(() => s.value.show_citations === !0), Ho = ce(() => vp(s.value.show_ai_disclaimer, Fo.value)), fu = (d) => /^[0-9a-f]{16,}$/i.test(d) || /^[0-9a-f-]{32,}$/i.test(d), ar = (d) => {
      const g = (d || "").trim().toLowerCase();
      return !g || g === "unknown" ? "Knowledge base" : g.charAt(0).toUpperCase() + g.slice(1);
    }, lr = (d) => {
      let g = ((d == null ? void 0 : d.name) || "").trim();
      return !g || (g = g.replace(/^[0-9a-f]{16,}[_-]/i, "").replace(/\.(pdf|txt|md|html?|docx?|csv|json)$/i, ""), !g || fu(g)) ? ar(d == null ? void 0 : d.type) : g;
    }, qo = (d) => {
      const g = lr(d), u = ar(d == null ? void 0 : d.type);
      return g === u ? u : `${g} · ${u}`;
    }, cr = ce(() => s.value.collect_email === !0 && !zt.value), Wo = ie(!1), Sn = ie(""), ms = ie(!1), Bn = ce(() => !P.value && cr.value && !Wo.value), jo = async () => {
      const d = oe.value.trim();
      if (!d) {
        Sn.value = "Please enter your email address.";
        return;
      }
      if (!ws(d)) {
        Sn.value = "Please enter a valid email address.";
        return;
      }
      Sn.value = "", ms.value = !0;
      try {
        await xn(), Wo.value = !0;
      } catch {
        Sn.value = "Something went wrong. Please try again.";
      } finally {
        ms.value = !1;
      }
    }, ur = ie(null), Vo = ie(!0), fr = { mode: "floating", width: 400, height: 560 }, ai = ce(
      () => {
        var d;
        return ur.value || ((d = s.value.customization_metadata) == null ? void 0 : d.widget_display) || null;
      }
    ), hu = ce(() => {
      const d = ai.value;
      return d ? typeof d.mode == "string" && d.mode !== fr.mode || typeof d.width == "number" && d.width !== fr.width || typeof d.height == "number" && d.height !== fr.height : !1;
    }), du = ce(() => {
      var g;
      const d = {
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-lg)"
      };
      if (hu.value) {
        const u = (g = ai.value) == null ? void 0 : g.mode;
        return u === "sidebar-left" || u === "sidebar-right" ? { ...d, borderRadius: "0" } : d;
      }
      return zt.value ? window.innerWidth <= 768 ? {
        ...d,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        minWidth: "unset",
        borderRadius: "0"
      } : window.innerWidth <= 1024 ? {
        ...d,
        width: "95%",
        maxWidth: "700px",
        minWidth: "500px",
        height: "650px"
      } : {
        ...d,
        width: "100%",
        maxWidth: "400px",
        minWidth: "400px",
        height: "580px"
      } : d;
    }), Ko = ce(() => zt.value && l.value.length === 0), pu = ["form", "user_input", "rating", "product", "shopify_output"], gu = ce(
      () => l.value.some(
        (d) => pu.includes(d.message_type) || Array.isArray(d.attachments) && d.attachments.length > 0
      )
    ), mu = ce(() => {
      var g, u;
      return zt.value ? !0 : (((g = ai.value) == null ? void 0 : g.mode) === "ask-ai" || ((u = ai.value) == null ? void 0 : u.mode) === "search-bar") && !D.value;
    }), hr = ce(
      () => mu.value && rt.value && !X.value && !tt.value && !Bn.value && !At.value && !gu.value
    );
    Wt(hr, (d) => {
      window.parent.postMessage({ type: "WIDGET_SURFACE", palette: d }, "*");
    }, { immediate: !0 });
    const _u = ce(
      () => s.value.welcome_subtitle || `Ask a question — ${i.value || "the assistant"} answers from what it knows.`
    ), yu = ce(() => {
      var d;
      return ((d = ur.value) == null ? void 0 : d.hotkey) !== !1;
    });
    return (d, g) => U.value && z.value ? (k(), A("div", Ug, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: xt
      }, "×"),
      g[20] || (g[20] = zn('<div class="widget-unavailable-card" data-v-17e4cd7f><div class="widget-unavailable-icon-wrapper" data-v-17e4cd7f><svg class="widget-unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-17e4cd7f><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-v-17e4cd7f></path><path d="M9 12l2 2 4-4" data-v-17e4cd7f></path></svg></div><h2 class="widget-unavailable-title" data-v-17e4cd7f>Chat Unavailable</h2><p class="widget-unavailable-message" data-v-17e4cd7f> This chat widget is not currently configured. Please contact the website administrator to enable chat support. </p><div class="widget-unavailable-footer" data-v-17e4cd7f><svg class="chattermate-logo-small" width="14" height="14" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a></div></div>', 1))
    ])) : U.value ? (k(), A("div", zg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: xt
      }, "×"),
      b("div", Hg, [
        g[21] || (g[21] = zn('<div class="auth-error-header" data-v-17e4cd7f><svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-17e4cd7f><circle cx="12" cy="12" r="10" data-v-17e4cd7f></circle><line x1="12" y1="8" x2="12" y2="12" data-v-17e4cd7f></line><line x1="12" y1="16" x2="12.01" y2="16" data-v-17e4cd7f></line></svg><h2 data-v-17e4cd7f>Authentication Error</h2></div>', 1)),
        b("p", qg, ee(R.value), 1),
        b("button", {
          class: "auth-error-refresh-btn",
          onClick: g[0] || (g[0] = () => d.window.location.reload())
        }, " Refresh Page ")
      ])
    ])) : n.value && !U.value ? (k(), A("div", {
      key: 2,
      class: je(["chat-container cm-surface", [{ collapsed: !rt.value, "ask-anything-style": zt.value, aurora: Zn.value }, au.value]]),
      style: xe({ ...E(Ye), ...du.value, ...lu.value })
    }, [
      x.value ? (k(), A("div", Wg, g[22] || (g[22] = [
        zn('<div class="loading-spinner" data-v-17e4cd7f><div class="dot" data-v-17e4cd7f></div><div class="dot" data-v-17e4cd7f></div><div class="dot" data-v-17e4cd7f></div></div><div class="loading-text" data-v-17e4cd7f>Initializing chat...</div>', 2)
      ]))) : se("", !0),
      !x.value && E(M) !== "connected" ? (k(), A("div", {
        key: 1,
        class: je(["connection-status", E(M)])
      }, [
        E(M) === "connecting" ? (k(), A("div", jg, g[23] || (g[23] = [
          dn(" Connecting to chat service... ", -1),
          b("div", { class: "loading-dots" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : E(M) === "failed" ? (k(), A("div", Vg, [
          g[24] || (g[24] = dn(" Connection failed. ", -1)),
          b("button", {
            onClick: Gt,
            class: "reconnect-button"
          }, " Click here to reconnect ")
        ])) : se("", !0)
      ], 2)) : se("", !0),
      E(w) ? (k(), A("div", {
        key: 2,
        class: "error-alert",
        style: xe(E(Z))
      }, ee(E(c)), 5)) : se("", !0),
      hr.value ? (k(), oc(gp, {
        key: 3,
        messages: E(l),
        draft: Se.value,
        "agent-name": E(i),
        suggestions: or.value,
        "welcome-title": E(s).welcome_title,
        "welcome-subtitle": _u.value,
        placeholder: Gn.value,
        "input-enabled": Mt.value,
        loading: E(h),
        "show-citations": oi.value,
        disclaimer: Ho.value ? E(Xa) : "",
        active: Vo.value,
        hotkey: yu.value,
        "can-start-new-chat": Do.value,
        "starting-new-chat": Xn.value,
        "new-chat-armed": Tn.value,
        onNewChat: Bo,
        onCancelNewChat: ii,
        "citation-label": lr,
        "citation-tooltip": qo,
        "display-text": E(de),
        "is-streaming": E(ae),
        "onUpdate:draft": g[1] || (g[1] = (u) => Se.value = u),
        onSend: en,
        onAsk: Qs,
        onClose: xt
      }, null, 8, ["messages", "draft", "agent-name", "suggestions", "welcome-title", "welcome-subtitle", "placeholder", "input-enabled", "loading", "show-citations", "disclaimer", "active", "hotkey", "can-start-new-chat", "starting-new-chat", "new-chat-armed", "display-text", "is-streaming"])) : Ko.value ? (k(), A("div", {
        key: 4,
        class: je(["welcome-message-section", { aurora: Zn.value }]),
        style: xe(E(H))
      }, [
        b("div", Kg, [
          b("div", Gg, [
            ri.value ? (k(), A("div", {
              key: 0,
              class: "welcome-orb",
              style: xe(gs.value)
            }, null, 4)) : E(Fe) ? (k(), A("img", {
              key: 1,
              src: E(Fe),
              alt: E(i),
              class: "welcome-avatar"
            }, null, 8, Yg)) : se("", !0),
            b("h1", Xg, ee(E(s).welcome_title || `Welcome to ${E(i)}`), 1),
            b("p", Zg, ee(E(s).welcome_subtitle || "I'm here to help you with anything you need. What can I assist you with today?"), 1)
          ])
        ]),
        b("div", Jg, [
          !E(P) && !Me.value && cr.value ? (k(), A("div", Qg, [
            En(b("input", {
              "onUpdate:modelValue": g[2] || (g[2] = (u) => oe.value = u),
              type: "email",
              placeholder: "Enter your email address",
              disabled: E(h) || E(M) !== "connected",
              class: je([{
                invalid: oe.value.trim() && !E(ws)(oe.value.trim()),
                disabled: E(M) !== "connected"
              }, "welcome-email-input"])
            }, null, 10, em), [
              [Hn, oe.value]
            ])
          ])) : se("", !0),
          b("div", tm, [
            En(b("input", {
              "onUpdate:modelValue": g[3] || (g[3] = (u) => Se.value = u),
              type: "text",
              placeholder: Gn.value,
              onKeypress: fn,
              onInput: De,
              onChange: De,
              disabled: !Mt.value,
              class: je([{ disabled: !Mt.value }, "welcome-message-field"])
            }, null, 42, nm), [
              [Hn, Se.value]
            ]),
            b("button", {
              class: je(["welcome-send-button", { "aurora-send": Zn.value }]),
              style: xe(E(re)),
              onClick: en,
              disabled: !Se.value.trim() || !Mt.value
            }, [
              Zn.value ? (k(), A("svg", im, g[25] || (g[25] = [
                b("path", {
                  d: "M12 19V5M12 5L5 12M12 5L19 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ]))) : (k(), A("svg", rm, g[26] || (g[26] = [
                b("path", {
                  d: "M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ])))
            ], 14, sm)
          ])
        ]),
        b("div", {
          class: "powered-by-welcome",
          style: xe(E(me))
        }, g[27] || (g[27] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : se("", !0),
      X.value && He.value ? (k(), A("div", {
        key: 5,
        class: "landing-page-fullscreen",
        style: xe(E(H))
      }, [
        b("div", om, [
          b("div", am, [
            b("h2", lm, ee(He.value.heading), 1),
            b("div", cm, ee(He.value.content), 1)
          ]),
          b("div", um, [
            b("button", {
              class: "landing-page-button",
              onClick: tu
            }, ee(dt.value), 1)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: xe(E(me))
        }, g[28] || (g[28] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : tt.value && qe.value ? (k(), A("div", {
        key: 6,
        class: "form-fullscreen",
        style: xe(E(H))
      }, [
        b("div", fm, [
          qe.value.title || qe.value.description ? (k(), A("div", hm, [
            qe.value.title ? (k(), A("h2", dm, ee(qe.value.title), 1)) : se("", !0),
            qe.value.description ? (k(), A("p", pm, ee(qe.value.description), 1)) : se("", !0)
          ])) : se("", !0),
          b("div", gm, [
            (k(!0), A($e, null, mt(qe.value.fields, (u) => {
              var Q, be;
              return k(), A("div", {
                key: u.name,
                class: "form-field"
              }, [
                b("label", {
                  for: `fullscreen-form-${u.name}`,
                  class: "field-label"
                }, [
                  dn(ee(u.label) + " ", 1),
                  u.required ? (k(), A("span", _m, "*")) : se("", !0)
                ], 8, mm),
                u.type === "text" || u.type === "email" || u.type === "tel" ? (k(), A("input", {
                  key: 0,
                  id: `fullscreen-form-${u.name}`,
                  type: u.type,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: W.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  onBlur: (he) => Ot(u.name, he.target.value),
                  class: je(["form-input", { error: N.value[u.name] }]),
                  autocomplete: u.type === "email" ? "email" : u.type === "tel" ? "tel" : "off",
                  inputmode: u.type === "tel" ? "tel" : u.type === "email" ? "email" : "text"
                }, null, 42, ym)) : u.type === "number" ? (k(), A("input", {
                  key: 1,
                  id: `fullscreen-form-${u.name}`,
                  type: "number",
                  placeholder: u.placeholder || "",
                  required: u.required,
                  min: u.minLength,
                  max: u.maxLength,
                  value: W.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: je(["form-input", { error: N.value[u.name] }])
                }, null, 42, vm)) : u.type === "textarea" ? (k(), A("textarea", {
                  key: 2,
                  id: `fullscreen-form-${u.name}`,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: W.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: je(["form-textarea", { error: N.value[u.name] }]),
                  rows: "4"
                }, null, 42, bm)) : u.type === "select" ? (k(), A("select", {
                  key: 3,
                  id: `fullscreen-form-${u.name}`,
                  required: u.required,
                  value: W.value[u.name] || "",
                  onChange: (he) => Ot(u.name, he.target.value),
                  class: je(["form-select", { error: N.value[u.name] }])
                }, [
                  b("option", km, ee(u.placeholder || "Please select..."), 1),
                  (k(!0), A($e, null, mt((Array.isArray(u.options) ? u.options : ((Q = u.options) == null ? void 0 : Q.split(`
`)) || []).filter((he) => he.trim()), (he) => (k(), A("option", {
                    key: he,
                    value: he.trim()
                  }, ee(he.trim()), 9, xm))), 128))
                ], 42, wm)) : u.type === "checkbox" ? (k(), A("label", Am, [
                  b("input", {
                    id: `fullscreen-form-${u.name}`,
                    type: "checkbox",
                    required: u.required,
                    checked: W.value[u.name] || !1,
                    onChange: (he) => Ot(u.name, he.target.checked),
                    class: "form-checkbox"
                  }, null, 40, Tm),
                  b("span", Sm, ee(u.label), 1)
                ])) : u.type === "radio" ? (k(), A("div", Em, [
                  (k(!0), A($e, null, mt((Array.isArray(u.options) ? u.options : ((be = u.options) == null ? void 0 : be.split(`
`)) || []).filter((he) => he.trim()), (he) => (k(), A("label", {
                    key: he,
                    class: "radio-field"
                  }, [
                    b("input", {
                      type: "radio",
                      name: `fullscreen-form-${u.name}`,
                      value: he.trim(),
                      required: u.required,
                      checked: W.value[u.name] === he.trim(),
                      onChange: (Je) => Ot(u.name, he.trim()),
                      class: "form-radio"
                    }, null, 40, Cm),
                    b("span", Rm, ee(he.trim()), 1)
                  ]))), 128))
                ])) : se("", !0),
                N.value[u.name] ? (k(), A("div", Im, ee(N.value[u.name]), 1)) : se("", !0)
              ]);
            }), 128))
          ]),
          b("div", Lm, [
            b("button", {
              onClick: g[4] || (g[4] = () => {
                console.log("Submit button clicked!"), Zc();
              }),
              disabled: _.value,
              class: "submit-form-button",
              style: xe(E(re))
            }, [
              _.value ? (k(), A("span", Nm, g[29] || (g[29] = [
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1)
              ]))) : (k(), A("span", Pm, ee(qe.value.submit_button_text || "Submit"), 1))
            ], 12, Om)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: xe(E(me))
        }, g[30] || (g[30] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : !Ko.value && rt.value && !hr.value ? (k(), A("div", {
        key: 7,
        class: je(["chat-panel", { "ask-anything-chat": zt.value }]),
        style: xe(E(H))
      }, [
        zt.value ? (k(), A("div", {
          key: 1,
          class: "ask-anything-top",
          style: xe(E(Te))
        }, [
          b("div", zm, [
            Dt.value || E(Fe) ? (k(), A("img", {
              key: 0,
              src: Dt.value || E(Fe),
              alt: E(I).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Hm)) : se("", !0),
            b("div", qm, [
              b("h3", {
                style: xe(E(me))
              }, ee(E(i)), 5),
              b("p", {
                class: "ask-anything-subtitle",
                style: xe(E(me))
              }, ee(E(s).welcome_subtitle || "Ask me anything. I'm here to help."), 5)
            ])
          ])
        ], 4)) : (k(), A("div", {
          key: 0,
          class: "chat-header",
          style: xe(E(Te))
        }, [
          b("div", {
            class: "cm-header-sheen",
            style: xe({ background: "linear-gradient(90deg, transparent, " + (E(s).accent_color || "#C9F24E") + ", transparent)" })
          }, null, 4),
          b("div", Mm, [
            !Dt.value && (ri.value || !E(Fe)) ? (k(), A("div", {
              key: 0,
              class: "header-orb",
              style: xe(gs.value)
            }, null, 4)) : Dt.value || E(Fe) ? (k(), A("img", {
              key: 1,
              src: Dt.value || E(Fe),
              alt: E(I).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Fm)) : se("", !0),
            b("div", Dm, [
              b("h3", {
                style: xe(E(me))
              }, ee(E(I).human_agent_name || E(i)), 5),
              g[31] || (g[31] = b("div", { class: "status" }, [
                b("span", { class: "status-indicator online" }),
                b("span", { class: "status-text cm-presence" }, "Online · replies instantly")
              ], -1))
            ])
          ]),
          b("div", Bm, [
            Do.value ? (k(), A("button", {
              key: 0,
              type: "button",
              class: je(["header-new-chat", { armed: Tn.value }]),
              style: xe(E(me)),
              disabled: Xn.value,
              title: Tn.value ? "This ends the current chat — click again to confirm" : "Start a new chat",
              "aria-label": Tn.value ? "Confirm starting a new chat" : "Start a new chat",
              onClick: Bo,
              onBlur: ii
            }, [
              g[32] || (g[32] = b("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "aria-hidden": "true"
              }, [
                b("path", { d: "M12 20h9" }),
                b("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
              ], -1)),
              Tn.value ? (k(), A("span", Um, "Click again to start a new chat")) : se("", !0)
            ], 46, $m)) : se("", !0),
            b("button", {
              type: "button",
              class: "header-minimize",
              style: xe(E(me)),
              title: "Minimize",
              "aria-label": "Minimize chat",
              onClick: xt
            }, g[33] || (g[33] = [
              b("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2.5",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "aria-hidden": "true"
              }, [
                b("path", { d: "M6 9l6 6 6-6" })
              ], -1)
            ]), 4)
          ])
        ], 4)),
        E(m) ? (k(), A("div", Wm, g[34] || (g[34] = [
          b("div", { class: "loading-spinner" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : se("", !0),
        Bn.value ? (k(), A("div", {
          key: 3,
          class: "cm-email-gate",
          style: xe(E(H))
        }, [
          b("div", {
            class: "cm-email-gate-orb",
            style: xe(gs.value)
          }, null, 4),
          b("h3", jm, ee(E(s).welcome_title || "Before we start"), 1),
          g[35] || (g[35] = b("p", { class: "cm-email-gate-text" }, "Enter your email and we'll continue the chat.", -1)),
          En(b("input", {
            "onUpdate:modelValue": g[5] || (g[5] = (u) => oe.value = u),
            type: "email",
            inputmode: "email",
            autocomplete: "email",
            placeholder: "you@example.com",
            class: je(["cm-email-gate-input", { invalid: !!Sn.value }]),
            disabled: ms.value,
            onKeyup: wi(jo, ["enter"]),
            onInput: g[6] || (g[6] = (u) => Sn.value = "")
          }, null, 42, Vm), [
            [Hn, oe.value]
          ]),
          Sn.value ? (k(), A("p", Km, ee(Sn.value), 1)) : se("", !0),
          b("button", {
            type: "button",
            class: "cm-email-gate-btn",
            style: xe(E(re)),
            disabled: ms.value,
            onClick: jo
          }, ee(ms.value ? "Please wait…" : "Continue to chat"), 13, Gm)
        ], 4)) : se("", !0),
        En(b("div", {
          class: "chat-messages",
          ref_key: "messagesContainer",
          ref: J
        }, [
          cu.value ? (k(), A("div", Ym, [
            b("div", Xm, [
              ri.value || !E(Fe) ? (k(), A("div", {
                key: 0,
                class: "cm-welcome-orb",
                style: xe(gs.value)
              }, null, 4)) : (k(), A("img", {
                key: 1,
                src: E(Fe),
                alt: E(i),
                class: "cm-welcome-avatar"
              }, null, 8, Zm)),
              b("div", {
                class: "message-bubble cm-welcome-bubble",
                style: xe(E(te))
              }, ee(Uo.value), 5)
            ])
          ])) : se("", !0),
          (k(!0), A($e, null, mt(E(l), (u, Q) => {
            var be, he, Je, ke, Yt, _s, Jn, Yo, Xo, Zo, Jo, Qo, ea, ta, na, sa, ia, ra, oa;
            return k(), A("div", {
              key: Q,
              class: je([
                "message",
                u.message_type === "bot" || u.message_type === "agent" ? "agent-message" : u.message_type === "system" ? "system-message" : u.message_type === "rating" ? "rating-message" : u.message_type === "form" ? "form-message" : u.message_type === "product" || u.shopify_output ? "product-message" : "user-message"
              ])
            }, [
              u.message_type === "bot" || u.message_type === "agent" ? (k(), A("div", Jm, [
                Dt.value ? (k(), A("img", {
                  key: 0,
                  src: Dt.value,
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, Qm)) : !ri.value && E(Fe) ? (k(), A("img", {
                  key: 1,
                  src: E(Fe),
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, e_)) : (k(), A("div", {
                  key: 2,
                  class: "cm-msg-avatar-orb",
                  style: xe(gs.value)
                }, null, 4))
              ])) : se("", !0),
              b("div", t_, [
                b("div", {
                  class: "message-bubble",
                  style: xe(u.message_type === "system" || u.message_type === "rating" || u.message_type === "form" || u.message_type === "product" || u.shopify_output ? {} : u.message_type === "user" ? E(re) : E(te))
                }, [
                  u.message_type === "rating" ? (k(), A("div", n_, [
                    b("p", s_, "Rate the chat session that you had with " + ee(u.agent_name || E(I).human_agent_name || E(i) || "our agent"), 1),
                    b("div", {
                      class: je(["star-rating", { submitted: Ut.value || u.isSubmitted }])
                    }, [
                      (k(), A($e, null, mt(5, (O) => b("button", {
                        key: O,
                        class: je(["star-button", {
                          warning: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) <= 3,
                          success: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) > 3,
                          selected: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating)
                        }]),
                        onMouseover: (Xt) => !u.isSubmitted && gt(O),
                        onMouseleave: (Xt) => !u.isSubmitted && ti,
                        onClick: (Xt) => !u.isSubmitted && ni(O),
                        disabled: Ut.value || u.isSubmitted
                      }, " ★ ", 42, i_)), 64))
                    ], 2),
                    u.showFeedback && !u.isSubmitted ? (k(), A("div", r_, [
                      b("div", o_, [
                        En(b("input", {
                          "onUpdate:modelValue": (O) => u.feedback = O,
                          placeholder: "Please share your feedback (optional)",
                          disabled: Ut.value,
                          maxlength: "500",
                          class: "feedback-input"
                        }, null, 8, a_), [
                          [Hn, u.feedback]
                        ]),
                        b("div", l_, ee(((be = u.feedback) == null ? void 0 : be.length) || 0) + "/500", 1)
                      ]),
                      b("button", {
                        onClick: (O) => Kc(u.session_id, Ft.value, u.feedback),
                        disabled: Ut.value || !Ft.value,
                        class: "submit-rating-button",
                        style: xe({ backgroundColor: E(s).accent_color || "var(--accent-solid)" })
                      }, ee(Ut.value ? "Submitting..." : "Submit Rating"), 13, c_)
                    ])) : se("", !0),
                    u.isSubmitted && u.finalFeedback ? (k(), A("div", u_, [
                      b("div", f_, [
                        b("p", h_, ee(u.finalFeedback), 1)
                      ])
                    ])) : u.isSubmitted ? (k(), A("div", d_, " Thank you for your rating! ")) : se("", !0)
                  ])) : u.message_type === "form" ? (k(), A("div", p_, [
                    (Je = (he = u.attributes) == null ? void 0 : he.form_data) != null && Je.title || (Yt = (ke = u.attributes) == null ? void 0 : ke.form_data) != null && Yt.description ? (k(), A("div", g_, [
                      (Jn = (_s = u.attributes) == null ? void 0 : _s.form_data) != null && Jn.title ? (k(), A("h3", m_, ee(u.attributes.form_data.title), 1)) : se("", !0),
                      (Xo = (Yo = u.attributes) == null ? void 0 : Yo.form_data) != null && Xo.description ? (k(), A("p", __, ee(u.attributes.form_data.description), 1)) : se("", !0)
                    ])) : se("", !0),
                    b("div", y_, [
                      (k(!0), A($e, null, mt((Jo = (Zo = u.attributes) == null ? void 0 : Zo.form_data) == null ? void 0 : Jo.fields, (O) => {
                        var Xt, dr;
                        return k(), A("div", {
                          key: O.name,
                          class: "form-field"
                        }, [
                          b("label", {
                            for: `form-${O.name}`,
                            class: "field-label"
                          }, [
                            dn(ee(O.label) + " ", 1),
                            O.required ? (k(), A("span", b_, "*")) : se("", !0)
                          ], 8, v_),
                          O.type === "text" || O.type === "email" || O.type === "tel" ? (k(), A("input", {
                            key: 0,
                            id: `form-${O.name}`,
                            type: O.type,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: W.value[O.name] || "",
                            onInput: (We) => Ot(O.name, We.target.value),
                            onBlur: (We) => Ot(O.name, We.target.value),
                            class: je(["form-input", { error: N.value[O.name] }]),
                            disabled: _.value,
                            autocomplete: O.type === "email" ? "email" : O.type === "tel" ? "tel" : "off",
                            inputmode: O.type === "tel" ? "tel" : O.type === "email" ? "email" : "text"
                          }, null, 42, w_)) : O.type === "number" ? (k(), A("input", {
                            key: 1,
                            id: `form-${O.name}`,
                            type: "number",
                            placeholder: O.placeholder || "",
                            required: O.required,
                            min: O.min,
                            max: O.max,
                            value: W.value[O.name] || "",
                            onInput: (We) => Ot(O.name, We.target.value),
                            class: je(["form-input", { error: N.value[O.name] }]),
                            disabled: _.value
                          }, null, 42, k_)) : O.type === "textarea" ? (k(), A("textarea", {
                            key: 2,
                            id: `form-${O.name}`,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: W.value[O.name] || "",
                            onInput: (We) => Ot(O.name, We.target.value),
                            class: je(["form-textarea", { error: N.value[O.name] }]),
                            disabled: _.value,
                            rows: "3"
                          }, null, 42, x_)) : O.type === "select" ? (k(), A("select", {
                            key: 3,
                            id: `form-${O.name}`,
                            required: O.required,
                            value: W.value[O.name] || "",
                            onChange: (We) => Ot(O.name, We.target.value),
                            class: je(["form-select", { error: N.value[O.name] }]),
                            disabled: _.value
                          }, [
                            b("option", T_, ee(O.placeholder || "Select an option"), 1),
                            (k(!0), A($e, null, mt((Array.isArray(O.options) ? O.options : ((Xt = O.options) == null ? void 0 : Xt.split(`
`)) || []).filter((We) => We.trim()), (We) => (k(), A("option", {
                              key: We.trim(),
                              value: We.trim()
                            }, ee(We.trim()), 9, S_))), 128))
                          ], 42, A_)) : O.type === "checkbox" ? (k(), A("div", E_, [
                            b("input", {
                              id: `form-${O.name}`,
                              type: "checkbox",
                              checked: W.value[O.name] || !1,
                              onChange: (We) => Ot(O.name, We.target.checked),
                              class: "form-checkbox",
                              disabled: _.value
                            }, null, 40, C_),
                            b("label", {
                              for: `form-${O.name}`,
                              class: "checkbox-label"
                            }, ee(O.placeholder || O.label), 9, R_)
                          ])) : O.type === "radio" ? (k(), A("div", I_, [
                            (k(!0), A($e, null, mt((Array.isArray(O.options) ? O.options : ((dr = O.options) == null ? void 0 : dr.split(`
`)) || []).filter((We) => We.trim()), (We) => (k(), A("div", {
                              key: We.trim(),
                              class: "radio-option"
                            }, [
                              b("input", {
                                id: `form-${O.name}-${We.trim()}`,
                                name: `form-${O.name}`,
                                type: "radio",
                                value: We.trim(),
                                checked: W.value[O.name] === We.trim(),
                                onChange: (Zy) => Ot(O.name, We.trim()),
                                class: "form-radio",
                                disabled: _.value
                              }, null, 40, L_),
                              b("label", {
                                for: `form-${O.name}-${We.trim()}`,
                                class: "radio-label"
                              }, ee(We.trim()), 9, O_)
                            ]))), 128))
                          ])) : se("", !0),
                          N.value[O.name] ? (k(), A("div", N_, ee(N.value[O.name]), 1)) : se("", !0)
                        ]);
                      }), 128))
                    ]),
                    b("div", P_, [
                      b("button", {
                        onClick: () => {
                          var O;
                          console.log("Regular form submit button clicked!"), Yc((O = u.attributes) == null ? void 0 : O.form_data);
                        },
                        disabled: _.value,
                        class: "form-submit-button",
                        style: xe(E(re))
                      }, ee(_.value ? "Submitting..." : ((ea = (Qo = u.attributes) == null ? void 0 : Qo.form_data) == null ? void 0 : ea.submit_button_text) || "Submit"), 13, M_)
                    ])
                  ])) : u.message_type === "user_input" ? (k(), A("div", F_, [
                    (ta = u.attributes) != null && ta.prompt_message && u.attributes.prompt_message.trim() ? (k(), A("div", D_, ee(u.attributes.prompt_message), 1)) : se("", !0),
                    u.isSubmitted ? (k(), A("div", z_, [
                      g[36] || (g[36] = b("strong", null, "Your input:", -1)),
                      dn(" " + ee(u.submittedValue) + " ", 1),
                      (na = u.attributes) != null && na.confirmation_message && u.attributes.confirmation_message.trim() ? (k(), A("div", H_, ee(u.attributes.confirmation_message), 1)) : se("", !0)
                    ])) : (k(), A("div", B_, [
                      En(b("textarea", {
                        "onUpdate:modelValue": (O) => u.userInputValue = O,
                        class: "user-input-textarea",
                        placeholder: "Type your message here...",
                        rows: "3",
                        onKeydown: [
                          wi(Wn((O) => ir(u), ["ctrl"]), ["enter"]),
                          wi(Wn((O) => ir(u), ["meta"]), ["enter"])
                        ]
                      }, null, 40, $_), [
                        [Hn, u.userInputValue]
                      ]),
                      b("button", {
                        class: "user-input-submit-button",
                        onClick: (O) => ir(u),
                        disabled: !u.userInputValue || !u.userInputValue.trim()
                      }, " Submit ", 8, U_)
                    ]))
                  ])) : u.shopify_output || u.message_type === "product" ? (k(), A("div", q_, [
                    u.message ? (k(), A("div", {
                      key: 0,
                      innerHTML: E(Ai)(((ia = (sa = u.shopify_output) == null ? void 0 : sa.products) == null ? void 0 : ia.length) > 0 ? Qc(u.message) : u.message),
                      class: "product-message-text"
                    }, null, 8, W_)) : se("", !0),
                    (ra = u.shopify_output) != null && ra.products && u.shopify_output.products.length > 0 ? (k(), A("div", j_, [
                      g[38] || (g[38] = b("h3", { class: "carousel-title" }, "Products", -1)),
                      b("div", V_, [
                        (k(!0), A($e, null, mt(u.shopify_output.products, (O) => {
                          var Xt;
                          return k(), A("div", {
                            key: O.id,
                            class: "product-card-compact carousel-item"
                          }, [
                            (Xt = O.image) != null && Xt.src ? (k(), A("div", K_, [
                              b("img", {
                                src: O.image.src,
                                alt: O.title,
                                class: "product-thumbnail"
                              }, null, 8, G_)
                            ])) : se("", !0),
                            b("div", Y_, [
                              b("div", X_, [
                                b("div", Z_, ee(O.title), 1),
                                O.variant_title && O.variant_title !== "Default Title" ? (k(), A("div", J_, ee(O.variant_title), 1)) : se("", !0),
                                b("div", Q_, ee(O.price_formatted || E(a)(O.price, O.currency)), 1)
                              ]),
                              b("div", ey, [
                                b("button", {
                                  class: "view-details-button-compact",
                                  onClick: (dr) => {
                                    var We;
                                    return Jc(O, (We = u.shopify_output) == null ? void 0 : We.shop_domain);
                                  }
                                }, g[37] || (g[37] = [
                                  dn(" View product ", -1),
                                  b("span", { class: "external-link-icon" }, "↗", -1)
                                ]), 8, ty)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])
                    ])) : !u.message && ((oa = u.shopify_output) != null && oa.products) && u.shopify_output.products.length === 0 ? (k(), A("div", ny, g[39] || (g[39] = [
                      b("p", null, "No products found.", -1)
                    ]))) : !u.message && u.shopify_output && !u.shopify_output.products ? (k(), A("div", sy, g[40] || (g[40] = [
                      b("p", null, "No products to display.", -1)
                    ]))) : se("", !0)
                  ])) : (k(), A($e, { key: 4 }, [
                    E(ae)(Q) ? (k(), A("div", {
                      key: 0,
                      class: "message-streaming",
                      innerHTML: E(Ai)(E(de)(Q, u.message))
                    }, null, 8, iy)) : (k(), A("div", {
                      key: 1,
                      innerHTML: E(Ai)(u.message)
                    }, null, 8, ry)),
                    u.attachments && u.attachments.length > 0 ? (k(), A("div", oy, [
                      (k(!0), A($e, null, mt(u.attachments, (O) => (k(), A("div", {
                        key: O.id,
                        class: "attachment-item"
                      }, [
                        E(B)(O.content_type) ? (k(), A("div", ay, [
                          b("img", {
                            src: E(Y)(O.file_url),
                            alt: O.filename,
                            class: "attachment-image",
                            onClick: Wn((Xt) => E(Xe)({ url: O.file_url, filename: O.filename, type: O.content_type, file_url: E(Y)(O.file_url), size: void 0 }), ["stop"]),
                            style: { cursor: "pointer" }
                          }, null, 8, ly),
                          b("div", cy, [
                            b("a", {
                              href: E(Y)(O.file_url),
                              target: "_blank",
                              class: "attachment-link"
                            }, [
                              g[41] || (g[41] = b("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                "stroke-width": "2",
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round"
                              }, [
                                b("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                                b("polyline", { points: "7 10 12 15 17 10" }),
                                b("line", {
                                  x1: "12",
                                  y1: "15",
                                  x2: "12",
                                  y2: "3"
                                })
                              ], -1)),
                              dn(" " + ee(O.filename) + " ", 1),
                              b("span", fy, "(" + ee(E(S)(O.file_size)) + ")", 1)
                            ], 8, uy)
                          ])
                        ])) : (k(), A("a", {
                          key: 1,
                          href: E(Y)(O.file_url),
                          target: "_blank",
                          class: "attachment-link"
                        }, [
                          g[42] || (g[42] = b("svg", {
                            width: "14",
                            height: "14",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            "stroke-width": "2",
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round"
                          }, [
                            b("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" })
                          ], -1)),
                          dn(" " + ee(O.filename) + " ", 1),
                          b("span", dy, "(" + ee(E(S)(O.file_size)) + ")", 1)
                        ], 8, hy))
                      ]))), 128))
                    ])) : se("", !0)
                  ], 64))
                ], 4),
                oi.value && (u.message_type === "bot" || u.message_type === "agent") && u.sources && u.sources.length ? (k(), A("div", py, [
                  g[43] || (g[43] = b("span", { class: "citation-label" }, "Sources", -1)),
                  (k(!0), A($e, null, mt(u.sources, (O, Xt) => (k(), A("span", {
                    key: Xt,
                    class: "citation-chip",
                    title: qo(O)
                  }, ee(lr(O)), 9, gy))), 128))
                ])) : se("", !0),
                b("div", my, [
                  u.message_type === "user" ? (k(), A("span", _y, " You ")) : se("", !0)
                ])
              ])
            ], 2);
          }), 128)),
          E(h) ? (k(), A("div", {
            key: 1,
            class: je(["typing-indicator", { "reading-indicator": oi.value }])
          }, [
            oi.value ? (k(), A($e, { key: 0 }, [
              g[44] || (g[44] = b("div", {
                class: "reading-bars",
                "aria-hidden": "true"
              }, [
                b("span"),
                b("span"),
                b("span")
              ], -1)),
              g[45] || (g[45] = b("span", { class: "reading-label" }, "reading knowledge base", -1))
            ], 64)) : (k(), A("div", {
              key: 1,
              class: "cm-typing-bubble",
              style: xe(E(te))
            }, g[46] || (g[46] = [
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1)
            ]), 4))
          ], 2)) : se("", !0)
        ], 512), [
          [vh, !Bn.value]
        ]),
        uu.value ? (k(), A("div", yy, [
          (k(!0), A($e, null, mt(or.value, (u) => (k(), A("button", {
            key: u,
            type: "button",
            class: "cm-quick-action",
            disabled: !Mt.value,
            onClick: (Q) => Qs(u)
          }, ee(u), 9, vy))), 128))
        ])) : se("", !0),
        !At.value && !Bn.value ? (k(), A("div", {
          key: 5,
          class: je(["chat-input", { "ask-anything-input": zt.value }])
        }, [
          b("input", {
            ref_key: "fileInputRef",
            ref: ht,
            type: "file",
            accept: jy,
            multiple: "",
            style: { display: "none" },
            onChange: g[7] || (g[7] = //@ts-ignore
            (...u) => E(we) && E(we)(...u))
          }, null, 544),
          E(f).length > 0 ? (k(), A("div", by, [
            (k(!0), A($e, null, mt(E(f), (u, Q) => (k(), A("div", {
              key: Q,
              class: "file-preview-widget"
            }, [
              b("div", wy, [
                E(fs)(u.type) ? (k(), A("img", {
                  key: 0,
                  src: E(ne)(u),
                  alt: u.filename,
                  class: "file-preview-image-widget",
                  onClick: Wn((be) => E(Xe)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, null, 8, ky)) : (k(), A("div", {
                  key: 1,
                  class: "file-preview-icon-widget",
                  onClick: Wn((be) => E(Xe)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, g[47] || (g[47] = [
                  b("svg", {
                    width: "20",
                    height: "20",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2"
                  }, [
                    b("path", { d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
                    b("polyline", { points: "13 2 13 9 20 9" })
                  ], -1)
                ]), 8, xy))
              ]),
              b("div", Ay, [
                b("div", Ty, ee(u.filename), 1),
                b("div", Sy, ee(E(S)(u.size)), 1)
              ]),
              b("button", {
                type: "button",
                class: "file-preview-remove-widget",
                onClick: (be) => E(kt)(Q),
                title: "Remove file"
              }, " × ", 8, Ey)
            ]))), 128))
          ])) : se("", !0),
          Mo.value ? (k(), A("div", Cy, g[48] || (g[48] = [
            b("div", { class: "upload-spinner-widget" }, null, -1),
            b("span", { class: "upload-text-widget" }, "Uploading files...", -1)
          ]))) : se("", !0),
          b("div", Ry, [
            En(b("input", {
              "onUpdate:modelValue": g[8] || (g[8] = (u) => Se.value = u),
              type: "text",
              placeholder: Gn.value,
              onKeypress: fn,
              onInput: De,
              onChange: De,
              onPaste: g[9] || (g[9] = //@ts-ignore
              (...u) => E(ct) && E(ct)(...u)),
              onDrop: g[10] || (g[10] = //@ts-ignore
              (...u) => E(Ee) && E(Ee)(...u)),
              onDragover: g[11] || (g[11] = //@ts-ignore
              (...u) => E(et) && E(et)(...u)),
              onDragleave: g[12] || (g[12] = //@ts-ignore
              (...u) => E(Be) && E(Be)(...u)),
              disabled: !Mt.value,
              class: je({ disabled: !Mt.value, "ask-anything-field": zt.value })
            }, null, 42, Iy), [
              [Hn, Se.value]
            ]),
            eu.value ? (k(), A("button", {
              key: 0,
              type: "button",
              class: "attach-button",
              disabled: Mo.value,
              onClick: g[13] || (g[13] = //@ts-ignore
              (...u) => E(Js) && E(Js)(...u)),
              title: `Attach files (${E(f).length}/${al} used) or paste screenshots`
            }, g[49] || (g[49] = [
              b("svg", {
                width: "22",
                height: "22",
                viewBox: "0 0 24 24",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                b("path", {
                  d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
                  stroke: "currentColor",
                  "stroke-width": "2.2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                })
              ], -1),
              b("span", { class: "attach-button-glow" }, null, -1)
            ]), 8, Ly)) : se("", !0),
            b("button", {
              class: je(["send-button", { "ask-anything-send": zt.value }]),
              style: xe(E(re)),
              onClick: en,
              disabled: !Se.value.trim() && E(f).length === 0 || !Mt.value
            }, g[50] || (g[50] = [
              b("svg", {
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                b("path", {
                  d: "M12 19V5M5 12l7-7 7 7",
                  stroke: "currentColor",
                  "stroke-width": "2.2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                })
              ], -1)
            ]), 14, Oy)
          ])
        ], 2)) : At.value && !Bn.value ? (k(), A("div", Ny, [
          b("div", Py, [
            g[51] || (g[51] = b("p", { class: "ended-text" }, "This chat has ended.", -1)),
            b("button", {
              class: "start-new-conversation-button",
              style: xe(E(re)),
              onClick: ru
            }, " Click here to start a new conversation ", 4)
          ])
        ])) : se("", !0),
        Ho.value ? (k(), A("div", {
          key: 7,
          class: "ai-disclaimer",
          style: xe(E(me))
        }, ee(E(Xa)), 5)) : se("", !0),
        b("div", {
          class: "powered-by",
          style: xe(E(me))
        }, g[52] || (g[52] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : se("", !0),
      ds.value ? (k(), A("div", My, [
        b("div", Fy, [
          g[53] || (g[53] = b("h3", null, "Rate your conversation", -1)),
          b("div", Dy, [
            (k(), A($e, null, mt(5, (u) => b("button", {
              key: u,
              onClick: (Q) => Dn.value = u,
              class: je([{ active: u <= Dn.value }, "star-button"])
            }, " ★ ", 10, By)), 64))
          ]),
          En(b("textarea", {
            "onUpdate:modelValue": g[14] || (g[14] = (u) => Yn.value = u),
            placeholder: "Additional feedback (optional)",
            class: "rating-feedback"
          }, null, 512), [
            [Hn, Yn.value]
          ]),
          b("div", $y, [
            b("button", {
              onClick: g[15] || (g[15] = (u) => d.submitRating(Dn.value, Yn.value)),
              disabled: !Dn.value,
              class: "submit-button",
              style: xe(E(re))
            }, " Submit ", 12, Uy),
            b("button", {
              onClick: g[16] || (g[16] = (u) => ds.value = !1),
              class: "skip-rating"
            }, " Skip ")
          ])
        ])
      ])) : se("", !0),
      E(v) ? (k(), A("div", {
        key: 9,
        class: "preview-modal-overlay",
        onClick: g[19] || (g[19] = //@ts-ignore
        (...u) => E(Pt) && E(Pt)(...u))
      }, [
        b("div", {
          class: "preview-modal-content",
          onClick: g[18] || (g[18] = Wn(() => {
          }, ["stop"]))
        }, [
          b("button", {
            class: "preview-modal-close",
            onClick: g[17] || (g[17] = //@ts-ignore
            (...u) => E(Pt) && E(Pt)(...u))
          }, "×"),
          E(C) && E(fs)(E(C).type) ? (k(), A("div", zy, [
            b("img", {
              src: E(ne)(E(C)),
              alt: E(C).filename,
              class: "preview-modal-image"
            }, null, 8, Hy),
            b("div", qy, ee(E(C).filename), 1)
          ])) : se("", !0)
        ])
      ])) : se("", !0)
    ], 6)) : (k(), A("div", Wy));
  }
}), Ky = /* @__PURE__ */ Rc(Vy, [["__scopeId", "data-v-17e4cd7f"]]);
window.process || (window.process = { env: { NODE_ENV: "production" } });
const qt = window.__INITIAL_DATA__, Wc = new URL(window.location.href), jc = Wc.searchParams.get("preview") === "true", Vc = (e) => {
  const t = Wc.searchParams.get(e);
  if (!(!t || t === "undefined" || t.trim() === ""))
    return t;
}, Gy = jc ? Vc("widget_id") || (qt == null ? void 0 : qt.widgetId) || void 0 : (qt == null ? void 0 : qt.widgetId) || void 0, Yy = jc ? (qt == null ? void 0 : qt.initialToken) || Vc("token") || void 0 : (qt == null ? void 0 : qt.initialToken) || void 0, Xy = $h(Ky, {
  widgetId: Gy,
  token: Yy || void 0,
  initialAuthError: null
  // Let backend determine if auth is required
});
Xy.mount("#app");
