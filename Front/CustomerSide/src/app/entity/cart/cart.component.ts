import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Router} from "@angular/router";
import {Category} from "../../domain/category";
import {Product} from "../../domain/product";
import {Offer} from "../../domain/offer";
import {TokenServiceService} from "../../services/token-service/token-service.service";
import {UserInfo} from "../../domain/userInfo";
import {Token} from "../../domain/token";
import {Icon} from "../main-page/main-page.component";
import {ProductCard} from "../main-page/main-page.component";
import {ProductCardServiceService} from "../../services/product-card-service/product-card-service.service";
import {CartServiceService} from "../../services/cart-service/cart-service.service";

export interface supportCartItem {
  productCard: ProductCard
  count: number
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartProductCards = new Map<ProductCard, number>();
  supportCartItems: supportCartItem[] = [];

  maleCategory!: Category[];
  femaleCategory!: Category[];
  products: Product[] = [];
  offers: Offer[] = [];
  userInfo!: UserInfo;

  token!: Token;
  password!: string;
  login!: string;
  email!: string;
  error: any;
  isEmpty!: boolean;

  maleMenuShow: boolean = false;
  femaleMenuShow: boolean = false;
  modalWindowOpen: boolean = false;


  constructor(private http: HttpClient, private router: Router) {

    this.http.get<Category[]>('http://localhost:8081/rest/categories/MALE').subscribe(result => {
      this.maleCategory = result;
    });

    this.http.get<Category[]>('http://localhost:8081/rest/categories/FEMALE').subscribe(result => {
      this.femaleCategory = result;
    });

    this.http.get<Product[]>('http://localhost:8081/rest/products').subscribe(result => {
      this.products = result;
    });

    this.http.get<Offer[]>('http://localhost:8081/rest/offers').subscribe(result => {
      this.offers = result;
    });

  }

  ngOnInit() {

  }

  ngDoCheck() {
    let x = 0;
    if ((this.offers.length != 0 && this.products.length != 0)) {
      x++;
    }
    if (x === 1) {
      this.fillProductCards()
    }

    if (CartServiceService.cartWasChanged && CartServiceService.cart.size > 0) {
      this.fillCartProductCards();
    }

    if (CartServiceService.cart.size > 0) {
      this.isEmpty = false;
    } else {
      this.isEmpty = true;
    }
  }

  showFemaleMenu() {
    this.femaleMenuShow = true;
  }

  hideFemaleMenu()
    :
    void {
    this.femaleMenuShow = false;
  }

  showMaleMenu() {
    this.maleMenuShow = true;
  }

  hideMaleMenu()
    :
    void {
    this.maleMenuShow = false;
  }

  showScroll() {
    this.modalWindowOpen = false;
  }

  hideScroll() {
    this.modalWindowOpen = true;
  }

  getProductById(productId
                   :
                   bigint
  ):
    Product {
    let currentProduct = new Product();
    for (let i = 0; i < this.products.length; i++) {
      if (this.products[i].id == productId) {
        currentProduct = this.products[i]
      }
    }
    return currentProduct;
  }

  makeBig(number
            :
            number
  ) {
    return BigInt(number)
  }

  icons: Icon[] = [
    {width: 30, height: 30, src: 'assets/img/icons/search.png', alt: 'Поиск'},
    {width: 30, height: 30, src: 'assets/img/icons/user.png', alt: 'Личный кабинет'}
  ]

  productCards: ProductCard[] = [];
  productCardsUniqueArticle: ProductCard[] = [];
  bestOffers: ProductCard[] = [];
  offerInCart: ProductCard[] = [];
  countInCart: number[] = [];
  currentProductCard!
    :
    ProductCard;
  currentProduct: Product = new Product();

  productCardsFilled = false;

  fillProductCards() {
    if (!this.productCardsFilled) {
      for (let i = 0; i < this.offers.length; i++) {
        this.currentProduct = this.getProductById(this.offers[i].productId);

        this.currentProductCard = {
          productId: this.currentProduct.id,
          offerId: this.offers[i].id,
          price: this.offers[i].price,
          priceOverride: this.offers[i].price_override,
          article: this.currentProduct.article,
          productName: this.currentProduct.productName,
          imageUrl: this.currentProduct.imageUrl
        }
        this.productCards.push(this.currentProductCard)
      }

      this.productCardsUniqueArticle = this.productCards;
      let articleList: string[] = [];

      for (let i = this.productCardsUniqueArticle.length - 1; i >= 0; i--) {
        if (articleList.includes(this.productCardsUniqueArticle[i].article)) {
          this.productCardsUniqueArticle.splice(i, 1);
        } else {
          articleList.push(this.productCardsUniqueArticle[i].article)
        }
      }

      ProductCardServiceService.productCards = this.productCards;

      this.bestOffers.push(this.productCardsUniqueArticle[0]);
      this.bestOffers.push(this.productCardsUniqueArticle[1]);
      this.bestOffers.push(this.productCardsUniqueArticle[2]);
      this.bestOffers.push(this.productCardsUniqueArticle[3]);
      this.bestOffers.push(this.productCardsUniqueArticle[4]);
      this.productCardsFilled = true
      console.log(this.productCards)
    }
  }

  changeLogin(event: any) {
    this.login = event.target.value;
  }

  changePassword(event: any) {
    this.password = event.target.value;
  }

  getToken(): void {
    let body = new URLSearchParams();
    body.set('username', this.login);
    body.set('password', this.password);
    body.set('client_id', "springboot-keycloak");
    body.set('grant_type', "password");

    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    this.http
      .post<Token>('http://localhost:8080/realms/shop/protocol/openid-connect/token', body.toString(), options)
      .subscribe((result) => {
        this.token = result;
      }, (error) => {
        this.error = error.message
        console.log(error)
      }, () => {
        console.log(this.token.access_token);
        TokenServiceService.loadRefreshTokenTimer();
        this.getUserInfo();
      });
  }

  getUserInfo(): void {
    if (this.token != undefined) {
      let options = {
        headers: new HttpHeaders().set('Authorization', 'Bearer ' + this.token.access_token.toString())
      };

      this.http
        .get<UserInfo>('http://localhost:8080/realms/shop/protocol/openid-connect/userinfo', options)
        .subscribe(result => {
          this.userInfo = result;
          this.email = result.email;
        }, (error) => {
          this.error = error.message
          console.log(error)
        }, () => {
          TokenServiceService.token = this.token;
          TokenServiceService.email = this.email;
          TokenServiceService.isAuthorized = true;
          this.router.navigate(['../authorized'])
        });
    }
  }

  fillCartProductCards(): void {
    for (let currentProductInCart of CartServiceService.cart) {
      for (let currentProductCard of this.productCards) {
        if (currentProductCard.offerId === currentProductInCart[0]) {
          this.cartProductCards.set(currentProductCard, currentProductInCart[1]);

          if (!this.offerInCart.includes(currentProductCard)) {
            this.offerInCart.push(currentProductCard);
          }
        }
      }
    }
    this.supportCartItems = [];
    for (let currentCardInCart of this.cartProductCards) {
      this.countInCart.push(currentCardInCart[1]);
    }

    console.log(this.cartProductCards.size)

    let counter = 0;
    for (let currentCardInCart of this.cartProductCards) {
      this.supportCartItems.push({productCard: currentCardInCart[0], count: this.countInCart[counter]}
      )
      counter++;
    }
  }
}


